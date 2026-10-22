import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Icon } from '@/src/components/icons/Icon';
import { AppText } from '@/src/components/ui/ui';
import { Place } from '@/src/data/mock';
import { menuViewFor, paperFileName } from '@/src/place/placeData';

const SHEET = '#3A3442'; // the dark "PDF viewer" colour from the prototype

// The menu as a sheet that slides up over the page, with a close (X) button.
//  - If the place has a menuPdfUrl, the PDF opens INSIDE the app (a web view; on Android wrapped in a viewer).
//  - Otherwise (and if the PDF cannot load) the items are drawn like a paper menu, as in the prototype.
export function MenuSheet({ place, visible, onClose }: { place: Place; visible: boolean; onClose: () => void }) {
  const view = menuViewFor(place, Platform.OS);
  const [pdfFailed, setPdfFailed] = useState(false);
  useEffect(() => {
    if (visible) setPdfFailed(false); // try the PDF again each time the sheet opens
  }, [visible]);

  const showPdf = view.kind === 'pdf' && !pdfFailed;
  const fileName = view.kind === 'pdf' ? view.fileName : paperFileName(place);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        {/* Tapping the dark area above the sheet closes it */}
        <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close menu" />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.header}>
            <View style={styles.fileRow}>
              <View style={styles.pdfTag}>
                <AppText tone="onBrand" weight="800" size={10}>PDF</AppText>
              </View>
              <AppText tone="onBrand" weight="600" size={14} numberOfLines={1} style={{ flexShrink: 1 }}>{fileName}</AppText>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close menu" style={styles.close}>
              <Icon name="close" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {showPdf && view.kind === 'pdf' ? (
            <View style={styles.pdfBox}>
              <WebView
                source={{ uri: view.viewerUri }}
                originWhitelist={['https://*']}
                // Stay on https pages only
                onShouldStartLoadWithRequest={(request) => request.url.startsWith('https://') || request.url.startsWith('about:')}
                setSupportMultipleWindows={false}
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.loading}><ActivityIndicator color="#6A1FB0" /></View>
                )}
                onError={() => setPdfFailed(true)}
                onHttpError={() => setPdfFailed(true)}
                accessibilityLabel={`Menu of ${place.name}`}
              />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
              {view.kind === 'pdf' ? (
                <AppText tone="onBrand" size={12} style={styles.notice}>The menu file could not be opened, so here are the items instead.</AppText>
              ) : null}
              <PaperMenu place={place} />
              <AppText tone="onBrand" size={12} style={styles.page}>Page 1 of 1</AppText>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// The menu items on "paper" (prototype: .pdf): a serif title, the menu kind, then name ..... price.
export function PaperMenu({ place }: { place: Pick<Place, 'name' | 'kind' | 'menu'> }) {
  return (
    <View style={styles.paper}>
      <AppText style={[styles.serif, styles.paperTitle]}>{place.name}</AppText>
      <AppText style={[styles.serif, styles.paperKind]}>{place.kind.toUpperCase()}</AppText>
      {place.menu.map((item) => (
        <View key={item.name} style={styles.paperRow}>
          <AppText style={[styles.serif, styles.paperText]}>{item.name}</AppText>
          <View style={styles.dots} />
          <AppText style={[styles.serif, styles.paperText, { fontWeight: '700' }]}>AED {item.price}</AppText>
        </View>
      ))}
      <AppText style={[styles.serif, styles.paperFoot]}>Prices include VAT</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,5,30,0.5)' },
  sheet: { height: '88%', backgroundColor: SHEET, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  pdfTag: { backgroundColor: '#E5383B', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  pdfBox: { flex: 1, borderRadius: 6, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  loading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  notice: { opacity: 0.8, marginBottom: 10, textAlign: 'center' },
  page: { textAlign: 'center', opacity: 0.8, marginTop: 12 },
  paper: { backgroundColor: '#FFFDF8', borderRadius: 6, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.25)' },
  serif: { fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }), color: '#2B1D12' },
  paperTitle: { textAlign: 'center', fontSize: 26, fontWeight: '700' },
  paperKind: { textAlign: 'center', fontSize: 12, letterSpacing: 3, color: '#8A6E50', marginTop: 4, marginBottom: 18 },
  paperRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingVertical: 7 },
  paperText: { fontSize: 14 },
  dots: { flex: 1, borderBottomWidth: 1.5, borderBottomColor: '#B9A58C', borderStyle: 'dotted', transform: [{ translateY: -4 }] },
  paperFoot: { textAlign: 'center', fontSize: 11, color: '#8A6E50', marginTop: 18 },
});
