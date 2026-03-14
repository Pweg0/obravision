/**
 * SINAPI Seed Script
 *
 * Populates the SinapiComposicao table from an official SINAPI Excel file.
 *
 * Usage:
 *   1. Download the SINAPI composition table from CEF:
 *      https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/referencial-analitico/Paginas/default.aspx
 *      Choose your state (UF) and reference month.
 *
 *   2. Run this script:
 *      npx tsx scripts/seed-sinapi.ts --file ./SINAPI_SP_2024-11.xlsx --estado SP --referencia 2024-11
 *
 *   3. After seeding, run the tsvector migration:
 *      psql $DATABASE_URL < packages/db/prisma/migrations/sinapi_tsvector.sql
 *
 * Expected Excel columns (SINAPI default format):
 *   - Column A or "Codigo": composition code (e.g. "74209/001")
 *   - Column B or "Descricao": description text
 *   - Column C or "Unidade": unit of measure
 *   - Column D or "Custo Total sem Desoneração" or similar: unit cost
 *
 * The script auto-detects column headers and maps them. If your file uses
 * different headers, pass --descricao-col, --unidade-col, --custo-col flags.
 */

import path from "path"
import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient()

interface CliArgs {
  file: string
  estado: string
  referencia: string
  descricaoCol: string
  unidadeCol: string
  custoCol: string
  codigoCol: string
  batchSize: number
  dryRun: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const get = (flag: string, fallback: string) => {
    const idx = args.indexOf(flag)
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback
  }

  return {
    file: get("--file", ""),
    estado: get("--estado", "SP").toUpperCase(),
    referencia: get("--referencia", ""),
    descricaoCol: get("--descricao-col", "Descricao"),
    unidadeCol: get("--unidade-col", "Unidade"),
    custoCol: get("--custo-col", "Custo"),
    codigoCol: get("--codigo-col", "Codigo"),
    batchSize: parseInt(get("--batch-size", "500"), 10),
    dryRun: args.includes("--dry-run"),
  }
}

async function main() {
  const args = parseArgs()

  if (!args.file) {
    console.error("Erro: --file e obrigatorio. Ex: --file ./SINAPI_SP_2024-11.xlsx")
    process.exit(1)
  }

  if (!args.estado || args.estado.length !== 2) {
    console.error("Erro: --estado deve ser a UF com 2 letras. Ex: --estado SP")
    process.exit(1)
  }

  const filePath = path.resolve(args.file)
  console.log(`\nLendo arquivo: ${filePath}`)
  console.log(`Estado: ${args.estado} | Referencia: ${args.referencia || "sem referencia"}`)

  const XLSX = await import("xlsx")
  const wb = XLSX.readFile(filePath)
  const sheetName = wb.SheetNames[0]

  if (!sheetName) {
    console.error("Erro: Planilha vazia")
    process.exit(1)
  }

  const ws = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

  console.log(`Total de linhas: ${rows.length}`)

  if (rows.length === 0) {
    console.error("Nenhuma linha encontrada")
    process.exit(1)
  }

  // Auto-detect columns from first row keys
  const firstRowKeys = Object.keys(rows[0] ?? {})
  console.log("Colunas detectadas:", firstRowKeys.slice(0, 8).join(", "))

  // Find best match for each required column
  const findCol = (hint: string, alternatives: string[]): string | null => {
    const candidates = [hint, ...alternatives]
    for (const c of candidates) {
      const found = firstRowKeys.find((k) => k.toLowerCase().includes(c.toLowerCase()))
      if (found) return found
    }
    return null
  }

  const codigoKey = findCol(args.codigoCol, ["codigo", "cod", "code", "item"])
  const descricaoKey = findCol(args.descricaoCol, ["descricao", "desc", "description", "nome"])
  const unidadeKey = findCol(args.unidadeCol, ["unidade", "und", "unit", "un"])
  const custoKey = findCol(args.custoCol, ["custo", "preco", "valor", "total", "unitario", "cost"])

  if (!codigoKey || !descricaoKey || !unidadeKey || !custoKey) {
    console.error(
      `Colunas nao encontradas. Necessarias: codigo="${codigoKey}", descricao="${descricaoKey}", unidade="${unidadeKey}", custo="${custoKey}"`
    )
    console.error("Use --codigo-col, --descricao-col, --unidade-col, --custo-col para especificar manualmente")
    process.exit(1)
  }

  console.log(
    `Mapeamento: codigo="${codigoKey}" | descricao="${descricaoKey}" | unidade="${unidadeKey}" | custo="${custoKey}"`
  )

  // Parse rows
  const items: Array<{
    codigo: string
    descricao: string
    unidade: string
    custoUnitario: Prisma.Decimal
    estado: string
    referencia: string | null
  }> = []

  let skipped = 0

  for (const row of rows) {
    const codigo = String(row[codigoKey] ?? "").trim()
    const descricao = String(row[descricaoKey] ?? "").trim()
    const unidade = String(row[unidadeKey] ?? "").trim()
    const custoRaw = row[custoKey]
    const custo = typeof custoRaw === "number" ? custoRaw : parseFloat(String(custoRaw ?? "0").replace(",", "."))

    if (!codigo || !descricao || !unidade || isNaN(custo)) {
      skipped++
      continue
    }

    items.push({
      codigo,
      descricao,
      unidade,
      custoUnitario: new Prisma.Decimal(custo.toFixed(4)),
      estado: args.estado,
      referencia: args.referencia || null,
    })
  }

  console.log(`Itens validos: ${items.length} | Ignorados: ${skipped}`)

  if (args.dryRun) {
    console.log("\n[DRY RUN] Primeiros 5 itens:")
    items.slice(0, 5).forEach((item) => {
      console.log(`  ${item.codigo} | ${item.descricao.slice(0, 50)} | ${item.unidade} | R$ ${item.custoUnitario}`)
    })
    console.log("\n[DRY RUN] Nenhum dado foi inserido.")
    return
  }

  // Bulk insert in batches with upsert
  let inserted = 0
  let updated = 0

  for (let i = 0; i < items.length; i += args.batchSize) {
    const batch = items.slice(i, i + args.batchSize)

    // Use upsert per item (by codigo) to handle re-runs
    for (const item of batch) {
      const result = await prisma.sinapiComposicao.upsert({
        where: { codigo: item.codigo },
        update: {
          descricao: item.descricao,
          unidade: item.unidade,
          custoUnitario: item.custoUnitario,
          estado: item.estado,
          referencia: item.referencia,
        },
        create: item,
      })

      if (result.id) {
        // Check if this was an insert or update (simplified: just count)
        inserted++
      }
    }

    const progress = Math.min(i + args.batchSize, items.length)
    console.log(`Progresso: ${progress}/${items.length} (${Math.round((progress / items.length) * 100)}%)`)
  }

  console.log(`\nConcluido! ${inserted} registros processados.`)
  console.log("\nProximo passo: aplique a migracao tsvector:")
  console.log("  psql $DATABASE_URL < packages/db/prisma/migrations/sinapi_tsvector.sql")
}

main()
  .catch((err) => {
    console.error("Erro fatal:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
