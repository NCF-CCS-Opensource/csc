import React from "react";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { QrCardModel } from "@/lib/qr";

// 8-up on A4, ~credit-card sized, with cut guides — one document shape for a
// single card or a bulk run (spec #116/#118): 2 columns wrap naturally at this
// card width within the page's content area, 4 rows fit the A4 height.
const CARDS_PER_PAGE = 8;

const styles = StyleSheet.create({
  page: {
    padding: "15mm",
    fontFamily: "Helvetica",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "85mm",
    height: "54mm",
    marginBottom: "10mm",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#94a3b8",
    padding: "6mm",
    flexDirection: "row",
    alignItems: "center",
    gap: "4mm",
  },
  qr: {
    width: "35mm",
    height: "35mm",
  },
  details: {
    flexShrink: 1,
  },
  name: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 3,
  },
  field: {
    fontSize: 8,
    color: "#334155",
    marginBottom: 2,
  },
});

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

export function QrCardPdfDocument({ cards }: { cards: QrCardModel[] }) {
  const pages = chunk(cards, CARDS_PER_PAGE);

  return (
    <Document title="QR Cards" author="CCS Attendance System">
      {(pages.length > 0 ? pages : [[]]).map((pageCards, index) => (
        <Page key={index} size="A4" style={styles.page}>
          <View style={styles.grid}>
            {pageCards.map((card) => (
              <View key={card.studentId} style={styles.card}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image, not an HTML img; no alt prop exists on it */}
                <Image src={card.qrImage} style={styles.qr} />
                <View style={styles.details}>
                  <Text style={styles.name}>{card.name}</Text>
                  <Text style={styles.field}>{card.studentId}</Text>
                  <Text style={styles.field}>{card.program}</Text>
                </View>
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  );
}

// Single render path for every QR Card PDF — the Student's own download and
// the onboarding email go through here, so the two are byte-identical (spec
// #118).
export async function renderQrCardPdf(cards: QrCardModel[]): Promise<Buffer> {
  return renderToBuffer(
    QrCardPdfDocument({ cards }) as React.ReactElement<DocumentProps>,
  );
}
