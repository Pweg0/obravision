import React from "react"
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer"

// ---- Types ----

export interface PropostaItem {
  id: string
  descricao: string
  unidade: string
  quantidade: number
  custoUnitario: number
  custoTotal: number
}

export interface PropostaEtapa {
  id: string
  nome: string
  itens: PropostaItem[]
  subtotalCusto: number
}

export interface PropostaComercialData {
  empresaNome: string
  obraNome: string
  obraEndereco: string
  dataGeracao: string
  bdi: number
  etapas: PropostaEtapa[]
  totalCusto: number
  totalVenda: number
}

// ---- Styles ----

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    color: "#1a1a1a",
  },
  // Header
  header: {
    marginBottom: 20,
    borderBottom: "1pt solid #e5e7eb",
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#6b7280",
  },
  headerMeta: {
    marginTop: 8,
    flexDirection: "row",
    gap: 20,
  },
  headerMetaItem: {
    fontSize: 8,
    color: "#6b7280",
  },
  headerMetaValue: {
    fontSize: 9,
    color: "#111827",
    fontFamily: "Helvetica-Bold",
  },
  // Table
  table: {
    marginTop: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderTop: "1pt solid #d1d5db",
    borderBottom: "1pt solid #d1d5db",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #e5e7eb",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRowEtapa: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderBottom: "0.5pt solid #d1d5db",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  // Column widths
  colDescricao: { flex: 4 },
  colUnidade: { width: 35 },
  colQuantidade: { width: 50, textAlign: "right" },
  colCusto: { width: 65, textAlign: "right" },
  colTotal: { width: 70, textAlign: "right" },
  // Typography
  cellHeader: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
  },
  cellText: {
    fontSize: 8,
    color: "#374151",
  },
  cellTextMuted: {
    fontSize: 7,
    color: "#6b7280",
  },
  cellEtapaText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  cellTextRight: {
    fontSize: 8,
    color: "#374151",
    textAlign: "right",
  },
  cellEtapaRight: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  // BDI summary
  bdiRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 8,
  },
  bdiLabel: {
    fontSize: 9,
    color: "#6b7280",
    width: 120,
    textAlign: "right",
  },
  bdiValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    width: 80,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
    borderTop: "1pt solid #d1d5db",
    paddingTop: 6,
    gap: 8,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    width: 120,
    textAlign: "right",
  },
  totalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1d4ed8",
    width: 80,
    textAlign: "right",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    borderTop: "0.5pt solid #e5e7eb",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
  },
})

// ---- Helpers ----

function formatBRL(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`
}

function formatNum(value: number) {
  return value.toFixed(4).replace(".", ",")
}

// ---- Template ----

export function PropostaComercial({ data }: { data: PropostaComercialData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Proposta Comercial</Text>
          <Text style={styles.headerSubtitle}>{data.obraNome}</Text>
          <View style={styles.headerMeta}>
            <View>
              <Text style={styles.headerMetaItem}>Empresa</Text>
              <Text style={styles.headerMetaValue}>{data.empresaNome}</Text>
            </View>
            <View>
              <Text style={styles.headerMetaItem}>Endereco</Text>
              <Text style={styles.headerMetaValue}>{data.obraEndereco}</Text>
            </View>
            <View>
              <Text style={styles.headerMetaItem}>BDI Aplicado</Text>
              <Text style={styles.headerMetaValue}>{data.bdi.toFixed(2)}%</Text>
            </View>
            <View>
              <Text style={styles.headerMetaItem}>Data</Text>
              <Text style={styles.headerMetaValue}>{data.dataGeracao}</Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.cellHeader, styles.colDescricao]}>Descricao</Text>
            <Text style={[styles.cellHeader, styles.colUnidade]}>Un.</Text>
            <Text style={[styles.cellHeader, styles.colQuantidade]}>Qtd.</Text>
            <Text style={[styles.cellHeader, styles.colCusto]}>Preco Unit. (R$)</Text>
            <Text style={[styles.cellHeader, styles.colTotal]}>Total (R$)</Text>
          </View>

          {/* Etapas and items */}
          {data.etapas.map((etapa) => {
            const etapaVenda = etapa.subtotalCusto * (1 + data.bdi / 100)
            return (
              <React.Fragment key={etapa.id}>
                {/* Etapa row */}
                <View style={styles.tableRowEtapa}>
                  <Text style={[styles.cellEtapaText, styles.colDescricao]}>{etapa.nome}</Text>
                  <Text style={[styles.cellTextMuted, styles.colUnidade]} />
                  <Text style={[styles.cellTextMuted, styles.colQuantidade]} />
                  <Text style={[styles.cellTextMuted, styles.colCusto]} />
                  <Text style={[styles.cellEtapaRight, styles.colTotal]}>
                    {formatBRL(etapaVenda)}
                  </Text>
                </View>
                {/* Item rows */}
                {etapa.itens.map((item) => {
                  const precoUnitVenda = item.custoUnitario * (1 + data.bdi / 100)
                  const precoTotalVenda = item.custoTotal * (1 + data.bdi / 100)
                  return (
                    <View key={item.id} style={styles.tableRow}>
                      <Text style={[styles.cellText, styles.colDescricao]}>{item.descricao}</Text>
                      <Text style={[styles.cellTextMuted, styles.colUnidade]}>{item.unidade}</Text>
                      <Text style={[styles.cellTextRight, styles.colQuantidade]}>
                        {formatNum(item.quantidade)}
                      </Text>
                      <Text style={[styles.cellTextRight, styles.colCusto]}>
                        {formatBRL(precoUnitVenda)}
                      </Text>
                      <Text style={[styles.cellTextRight, styles.colTotal]}>
                        {formatBRL(precoTotalVenda)}
                      </Text>
                    </View>
                  )
                })}
              </React.Fragment>
            )
          })}
        </View>

        {/* Summary */}
        <View style={{ marginTop: 12 }}>
          <View style={styles.bdiRow}>
            <Text style={styles.bdiLabel}>Custo Total (sem BDI):</Text>
            <Text style={styles.bdiValue}>{formatBRL(data.totalCusto)}</Text>
          </View>
          <View style={styles.bdiRow}>
            <Text style={styles.bdiLabel}>BDI ({data.bdi.toFixed(2)}%):</Text>
            <Text style={styles.bdiValue}>{formatBRL(data.totalVenda - data.totalCusto)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>PRECO DE VENDA TOTAL:</Text>
            <Text style={styles.totalValue}>{formatBRL(data.totalVenda)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{data.empresaNome} — {data.obraNome}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
