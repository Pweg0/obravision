import React from "react"
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer"

// ---- Types ----

export interface BoletimFisicaItem {
  id: string
  descricao: string
  unidade: string
  quantidadeOrcada: number
  custoUnitario: number
  percentualExecutado: number
  valorExecutado: number
}

export interface BoletimContratoItem {
  id: string
  descricao: string
  unidade: string
  quantidade: number
  valorUnitario: number
  valorExecutado: number
  acumulado: number
}

export interface BoletimMedicaoData {
  empresaNome: string
  obraNome: string
  periodo: string
  tipo: "Fisica" | "Contrato"
  dataGeracao: string
  // Fisica fields
  progressoGeral?: number
  itensFisica?: BoletimFisicaItem[]
  // Contrato fields
  empreiteiroNome?: string
  empreiteiroCnpj?: string | null
  itensContrato?: BoletimContratoItem[]
  totalPeriodo?: number
  totalAcumuladoAnterior?: number
  totalAcumulado?: number
  // Approval
  status: string
  aprovadoPor?: string | null
  aprovadoEm?: string | null
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
  header: {
    marginBottom: 20,
    borderBottom: "1pt solid #e5e7eb",
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 4,
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
    width: 100,
  },
  infoValue: {
    fontSize: 8,
    color: "#111827",
    flex: 1,
  },
  // Progress bar (fisica)
  progressSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 9,
    color: "#374151",
  },
  progressValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#16a34a",
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
  // Column widths - fisica
  colDescricaoFisica: { flex: 4 },
  colUnidade: { width: 30 },
  colQtdOrcada: { width: 60, textAlign: "right" },
  colPctExec: { width: 55, textAlign: "right" },
  colValorExec: { width: 75, textAlign: "right" },
  // Column widths - contrato
  colDescricaoContrato: { flex: 3 },
  colQtd: { width: 55, textAlign: "right" },
  colValUnit: { width: 65, textAlign: "right" },
  colValExec: { width: 65, textAlign: "right" },
  colAcumulado: { width: 70, textAlign: "right" },
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
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 9,
    color: "#6b7280",
    width: 160,
    textAlign: "right",
    marginRight: 16,
  },
  totalValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    width: 80,
    textAlign: "right",
  },
  totalLabelBold: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    width: 160,
    textAlign: "right",
    marginRight: 16,
  },
  totalValueBold: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1d4ed8",
    width: 80,
    textAlign: "right",
  },
  // Approval section
  approvalSection: {
    marginTop: 24,
    padding: 12,
    border: "0.5pt solid #d1d5db",
    borderRadius: 4,
  },
  approvalTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    marginBottom: 8,
  },
  approvalStatus: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#16a34a",
    marginBottom: 8,
  },
  approvalStatusPending: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#d97706",
    marginBottom: 8,
  },
  signatureLine: {
    marginTop: 30,
    borderTop: "0.5pt solid #374151",
    paddingTop: 4,
    width: 200,
  },
  signatureText: {
    fontSize: 7,
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

function formatNum(value: number, decimals = 4) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: decimals })
}

// ---- Template ----

export function BoletimMedicao({ data }: { data: BoletimMedicaoData }) {
  const isFisica = data.tipo === "Fisica"

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Boletim de Medicao — {data.tipo === "Fisica" ? "Medicao Fisica" : "Medicao Contratual"}
          </Text>
          <Text style={styles.headerSubtitle}>{data.obraNome}</Text>
          <View style={styles.headerMeta}>
            <View>
              <Text style={styles.headerMetaItem}>Empresa</Text>
              <Text style={styles.headerMetaValue}>{data.empresaNome}</Text>
            </View>
            <View>
              <Text style={styles.headerMetaItem}>Periodo</Text>
              <Text style={styles.headerMetaValue}>{data.periodo}</Text>
            </View>
            <View>
              <Text style={styles.headerMetaItem}>Data de Geracao</Text>
              <Text style={styles.headerMetaValue}>{data.dataGeracao}</Text>
            </View>
            <View>
              <Text style={styles.headerMetaItem}>Status</Text>
              <Text style={styles.headerMetaValue}>{data.status}</Text>
            </View>
          </View>
        </View>

        {/* Physical measurement content */}
        {isFisica && data.itensFisica && (
          <>
            {/* Progress summary */}
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Progresso Geral Ponderado da Obra</Text>
              <Text style={styles.progressValue}>{(data.progressoGeral ?? 0).toFixed(1)}%</Text>
            </View>

            {/* Items table */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Itens Orcamentarios</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.cellHeader, styles.colDescricaoFisica]}>Descricao</Text>
                  <Text style={[styles.cellHeader, styles.colUnidade]}>Un.</Text>
                  <Text style={[styles.cellHeader, styles.colQtdOrcada]}>Qtd. Orc.</Text>
                  <Text style={[styles.cellHeader, styles.colPctExec]}>% Exec.</Text>
                  <Text style={[styles.cellHeader, styles.colValorExec]}>Valor Exec. (R$)</Text>
                </View>
                {data.itensFisica.map((item, index) => {
                  const rowStyle = index % 2 === 0 ? styles.tableRow : styles.tableRowAlt
                  return (
                    <View key={item.id} style={rowStyle}>
                      <Text style={[styles.cellText, styles.colDescricaoFisica]}>{item.descricao}</Text>
                      <Text style={[styles.cellTextMuted, styles.colUnidade]}>{item.unidade}</Text>
                      <Text style={[styles.cellTextRight, styles.colQtdOrcada]}>
                        {formatNum(item.quantidadeOrcada, 2)}
                      </Text>
                      <Text style={[styles.cellTextRight, styles.colPctExec]}>
                        {item.percentualExecutado.toFixed(1)}%
                      </Text>
                      <Text style={[styles.cellTextRight, styles.colValorExec]}>
                        {formatBRL(item.valorExecutado)}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          </>
        )}

        {/* Contract measurement content */}
        {!isFisica && data.itensContrato && (
          <>
            {/* Empreiteiro info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Empreiteiro</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nome:</Text>
                <Text style={styles.infoValue}>{data.empreiteiroNome ?? "—"}</Text>
              </View>
              {data.empreiteiroCnpj && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>CNPJ:</Text>
                  <Text style={styles.infoValue}>{data.empreiteiroCnpj}</Text>
                </View>
              )}
            </View>

            {/* Items table */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Itens do Boletim</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.cellHeader, styles.colDescricaoContrato]}>Descricao</Text>
                  <Text style={[styles.cellHeader, styles.colUnidade]}>Un.</Text>
                  <Text style={[styles.cellHeader, styles.colQtd]}>Qtd.</Text>
                  <Text style={[styles.cellHeader, styles.colValUnit]}>Val. Unit. (R$)</Text>
                  <Text style={[styles.cellHeader, styles.colValExec]}>Val. Exec. (R$)</Text>
                  <Text style={[styles.cellHeader, styles.colAcumulado]}>Acumulado (R$)</Text>
                </View>
                {data.itensContrato.map((item, index) => {
                  const rowStyle = index % 2 === 0 ? styles.tableRow : styles.tableRowAlt
                  return (
                    <View key={item.id} style={rowStyle}>
                      <Text style={[styles.cellText, styles.colDescricaoContrato]}>{item.descricao}</Text>
                      <Text style={[styles.cellTextMuted, styles.colUnidade]}>{item.unidade}</Text>
                      <Text style={[styles.cellTextRight, styles.colQtd]}>
                        {formatNum(item.quantidade, 2)}
                      </Text>
                      <Text style={[styles.cellTextRight, styles.colValUnit]}>
                        {formatBRL(item.valorUnitario)}
                      </Text>
                      <Text style={[styles.cellTextRight, styles.colValExec]}>
                        {formatBRL(item.valorExecutado)}
                      </Text>
                      <Text style={[styles.cellTextRight, styles.colAcumulado]}>
                        {formatBRL(item.acumulado)}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>

            {/* Totals */}
            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total do Periodo:</Text>
                <Text style={styles.totalValue}>{formatBRL(data.totalPeriodo ?? 0)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Acumulado Anterior:</Text>
                <Text style={styles.totalValue}>{formatBRL(data.totalAcumuladoAnterior ?? 0)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabelBold}>TOTAL ACUMULADO:</Text>
                <Text style={styles.totalValueBold}>{formatBRL(data.totalAcumulado ?? 0)}</Text>
              </View>
            </View>
          </>
        )}

        {/* Approval section */}
        <View style={styles.approvalSection}>
          <Text style={styles.approvalTitle}>Situacao da Medicao</Text>
          {data.status === "APROVADA" ? (
            <>
              <Text style={styles.approvalStatus}>APROVADA</Text>
              {data.aprovadoPor && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Aprovado por:</Text>
                  <Text style={styles.infoValue}>{data.aprovadoPor}</Text>
                </View>
              )}
              {data.aprovadoEm && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Data de aprovacao:</Text>
                  <Text style={styles.infoValue}>{data.aprovadoEm}</Text>
                </View>
              )}
            </>
          ) : data.status === "REJEITADA" ? (
            <Text style={[styles.approvalStatus, { color: "#dc2626" }]}>REJEITADA</Text>
          ) : (
            <>
              <Text style={styles.approvalStatusPending}>PENDENTE DE APROVACAO</Text>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureText}>Assinatura do Responsavel Tecnico</Text>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {data.empresaNome} — Boletim {data.tipo} — {data.periodo}
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
