import React from "react"
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer"

// ---- Types ----

export interface PedidoCompraItem {
  id: string
  descricao: string
  unidade: string
  quantidade: number
  precoUnitario: number
}

export interface PedidoCompraData {
  empresaNome: string
  obraNome: string
  pedidoId: string
  numeroPedido: string
  dataGeracao: string
  fornecedorNome: string
  fornecedorCnpj?: string | null
  fornecedorContato?: string | null
  fornecedorEmail?: string | null
  fornecedorTelefone?: string | null
  itens: PedidoCompraItem[]
  totalEstimado: number
  observacoes?: string | null
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
  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    marginBottom: 6,
    borderBottom: "0.5pt solid #e5e7eb",
    paddingBottom: 3,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 8,
    color: "#6b7280",
    width: 80,
  },
  infoValue: {
    fontSize: 8,
    color: "#111827",
    flex: 1,
  },
  // Table
  table: {
    marginTop: 4,
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
  tableRowAlt: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #e5e7eb",
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: "#f9fafb",
  },
  // Column widths
  colDescricao: { flex: 4 },
  colUnidade: { width: 35 },
  colQuantidade: { width: 55, textAlign: "right" },
  colPrecoUnit: { width: 70, textAlign: "right" },
  colTotal: { width: 75, textAlign: "right" },
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
  cellTextRight: {
    fontSize: 8,
    color: "#374151",
    textAlign: "right",
  },
  // Total rows
  totalSection: {
    marginTop: 12,
    borderTop: "1pt solid #d1d5db",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    width: 130,
    textAlign: "right",
    marginRight: 16,
  },
  totalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1d4ed8",
    width: 80,
    textAlign: "right",
  },
  // Observacoes
  obsSection: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  obsTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    marginBottom: 4,
  },
  obsText: {
    fontSize: 8,
    color: "#6b7280",
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
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 4 })
}

// ---- Template ----

export function PedidoCompra({ data }: { data: PedidoCompraData }) {
  const total = data.itens.reduce((sum, item) => sum + item.quantidade * item.precoUnitario, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pedido de Compra</Text>
          <Text style={styles.headerSubtitle}>{data.obraNome}</Text>
          <View style={styles.headerMeta}>
            <View>
              <Text style={styles.headerMetaItem}>Empresa</Text>
              <Text style={styles.headerMetaValue}>{data.empresaNome}</Text>
            </View>
            <View>
              <Text style={styles.headerMetaItem}>Numero do Pedido</Text>
              <Text style={styles.headerMetaValue}>{data.numeroPedido}</Text>
            </View>
            <View>
              <Text style={styles.headerMetaItem}>Data</Text>
              <Text style={styles.headerMetaValue}>{data.dataGeracao}</Text>
            </View>
          </View>
        </View>

        {/* Supplier Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fornecedor</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nome:</Text>
            <Text style={styles.infoValue}>{data.fornecedorNome}</Text>
          </View>
          {data.fornecedorCnpj && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>CNPJ:</Text>
              <Text style={styles.infoValue}>{data.fornecedorCnpj}</Text>
            </View>
          )}
          {data.fornecedorContato && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contato:</Text>
              <Text style={styles.infoValue}>{data.fornecedorContato}</Text>
            </View>
          )}
          {data.fornecedorEmail && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{data.fornecedorEmail}</Text>
            </View>
          )}
          {data.fornecedorTelefone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefone:</Text>
              <Text style={styles.infoValue}>{data.fornecedorTelefone}</Text>
            </View>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens do Pedido</Text>
          <View style={styles.table}>
            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.cellHeader, styles.colDescricao]}>Descricao</Text>
              <Text style={[styles.cellHeader, styles.colUnidade]}>Un.</Text>
              <Text style={[styles.cellHeader, styles.colQuantidade]}>Qtd.</Text>
              <Text style={[styles.cellHeader, styles.colPrecoUnit]}>Preco Unit. (R$)</Text>
              <Text style={[styles.cellHeader, styles.colTotal]}>Total (R$)</Text>
            </View>

            {/* Item rows */}
            {data.itens.map((item, index) => {
              const rowStyle = index % 2 === 0 ? styles.tableRow : styles.tableRowAlt
              const itemTotal = item.quantidade * item.precoUnitario
              return (
                <View key={item.id} style={rowStyle}>
                  <Text style={[styles.cellText, styles.colDescricao]}>{item.descricao}</Text>
                  <Text style={[styles.cellTextMuted, styles.colUnidade]}>{item.unidade}</Text>
                  <Text style={[styles.cellTextRight, styles.colQuantidade]}>
                    {formatNum(item.quantidade)}
                  </Text>
                  <Text style={[styles.cellTextRight, styles.colPrecoUnit]}>
                    {formatBRL(item.precoUnitario)}
                  </Text>
                  <Text style={[styles.cellTextRight, styles.colTotal]}>
                    {formatBRL(itemTotal)}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL DO PEDIDO:</Text>
          <Text style={styles.totalValue}>{formatBRL(total)}</Text>
        </View>

        {/* Observacoes */}
        {data.observacoes && (
          <View style={styles.obsSection}>
            <Text style={styles.obsTitle}>Observacoes:</Text>
            <Text style={styles.obsText}>{data.observacoes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {data.empresaNome} — Pedido {data.numeroPedido}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
