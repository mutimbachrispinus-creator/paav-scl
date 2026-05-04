import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#fff', fontFamily: 'Helvetica' },
  header: { borderBottom: '2px solid #8B1A1A', paddingBottom: 10, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#8B1A1A' },
  schoolName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  infoSection: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 10, color: '#666', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 12, fontWeight: 'bold' },
  table: { marginTop: 10, borderTop: '1px solid #eee' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #eee', padding: '10 0' },
  col1: { flex: 2 },
  col2: { flex: 1, textAlign: 'right' },
  totalSection: { marginTop: 20, borderTop: '2px solid #333', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footer: { marginTop: 50, textAlign: 'center', fontSize: 10, color: '#999' }
});

export const ReceiptPDF = ({ data }) => (
  <Document>
    <Page size="A5" orientation="landscape" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.schoolName}>{data.schoolName}</Text>
          <Text style={{ fontSize: 10, color: '#666' }}>Official Payment Receipt</Text>
        </View>
        <Text style={styles.title}>RECEIPT</Text>
      </View>

      <View style={styles.infoSection}>
        <View>
          <Text style={styles.label}>Student Name</Text>
          <Text style={styles.value}>{data.studentName}</Text>
          <Text style={{ fontSize: 10, color: '#666' }}>ADM: {data.adm}</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={styles.label}>Receipt No.</Text>
          <Text style={styles.value}>{data.reference}</Text>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{new Date().toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={[styles.col1, { fontWeight: 'bold' }]}>Description</Text>
          <Text style={[styles.col2, { fontWeight: 'bold' }]}>Amount (KES)</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.col1}>{data.description || 'School Fees Payment'}</Text>
          <Text style={styles.col2}>{Number(data.amount).toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.totalSection}>
        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>TOTAL PAID</Text>
        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>KES {Number(data.amount).toLocaleString()}</Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 10 }}>Payment Method: {data.method.toUpperCase()}</Text>
        <Text style={{ fontSize: 10 }}>Balance After: KES {Number(data.newBalance).toLocaleString()}</Text>
      </View>

      <Text style={styles.footer}>This is a computer generated receipt. Stamp required for official use.</Text>
    </Page>
  </Document>
);
