import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { StatementRow } from "@/lib/statement-pdf-labels";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 600,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    padding: 36,
    color: "#0f172a",
  },
  title: { fontSize: 16, fontWeight: 600, marginBottom: 4 },
  subtitle: { fontSize: 9, color: "#64748b", marginBottom: 12 },
  filterLine: { fontSize: 8, color: "#475569", marginBottom: 2 },
  summaryBox: {
    marginTop: 8,
    marginBottom: 14,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  summaryRow: { flexDirection: "row", marginBottom: 4 },
  summaryLabel: { width: 100, color: "#64748b" },
  summaryValue: { fontWeight: 600 },
  income: { color: "#15803d" },
  expense: { color: "#b91c1c" },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 4,
    marginBottom: 4,
    fontWeight: 600,
    fontSize: 8,
    color: "#475569",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  colDate: { width: 68, paddingRight: 6, flexShrink: 0 },
  colAmount: { width: 72, paddingRight: 6, flexShrink: 0 },
  amountText: { textAlign: "right" },
  colAccount: { width: 88, paddingRight: 6, flexShrink: 0 },
  colCategory: { width: 100, paddingRight: 6, flexShrink: 0 },
  colDesc: { flex: 1, flexShrink: 1, minWidth: 0 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 36,
    right: 36,
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
  },
});

export function StatementPdfDocument({
  generatedAt,
  filterLines,
  accruals,
  deductions,
  difference,
  rows,
}: {
  generatedAt: string;
  filterLines: string[];
  accruals: string;
  deductions: string;
  difference: string;
  rows: StatementRow[];
}) {
  return (
    <Document title="Виписка ФінОблік">
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>Виписка операцій</Text>
        <Text style={styles.subtitle}>ФінОблік · сформовано {generatedAt}</Text>
        {filterLines.map((line, i) => (
          <Text key={i} style={styles.filterLine}>
            {line}
          </Text>
        ))}

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Нарахування</Text>
            <Text style={[styles.summaryValue, styles.income]}>{accruals}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Відрахування</Text>
            <Text style={[styles.summaryValue, styles.expense]}>{deductions}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Різниця</Text>
            <Text style={styles.summaryValue}>{difference}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <View style={styles.colDate}>
            <Text>Дата</Text>
          </View>
          <View style={styles.colAmount}>
            <Text style={styles.amountText}>Сума</Text>
          </View>
          <View style={styles.colAccount}>
            <Text>Рахунок</Text>
          </View>
          <View style={styles.colCategory}>
            <Text>Категорія</Text>
          </View>
          <View style={styles.colDesc}>
            <Text>Опис</Text>
          </View>
        </View>
        {rows.map((row, i) => (
          <View key={i} style={styles.tableRow} wrap={false}>
            <View style={styles.colDate}>
              <Text>{row.date}</Text>
            </View>
            <View style={styles.colAmount}>
              <Text
                style={[
                  styles.amountText,
                  row.type === "income" ? styles.income : styles.expense,
                ]}
              >
                {row.amount}
              </Text>
            </View>
            <View style={styles.colAccount}>
              <Text>{row.account}</Text>
            </View>
            <View style={styles.colCategory}>
              <Text>{row.category}</Text>
            </View>
            <View style={styles.colDesc}>
              <Text>{row.description}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.footer}>
          Операцій у виписці: {rows.length}. Документ згенеровано в ФінОблік.
        </Text>
      </Page>
    </Document>
  );
}
