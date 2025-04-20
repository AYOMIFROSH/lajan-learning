import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  Share,
  Image,
  Alert
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import colors from '@/constants/colors';
import { X, Share2, Download } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  userData: any; // Update this type based on your User type
}

const QRCodeModal = ({ visible, onClose, userData }: QRCodeModalProps) => {
  // Reference to the QR code component
  const qrCodeRef = useRef();

  // Generate QR code data - this is what will be encoded in the QR code
  // For future "add friend" feature, include the user's unique identifier
  const qrCodeData = JSON.stringify({
    userId: userData?.id || '',
    name: userData?.name || '',
    email: userData?.email || '',
    type: 'user-profile'
  });

  // Calculate optimal logo size (typically 20-25% of QR code size)
  const qrSize = SCREEN_WIDTH * 0.6;
  const logoSize = qrSize * 0.25;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Scan this QR code to add me on Lajan: ${userData?.name}`,
        title: 'My FinEd Profile QR Code'
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };

  const handleDownload = async () => {
    try {
      // Request permission first
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant media library permissions to save the QR code');
        return;
      }

      // Get the QR code as a base64 image
      // @ts-ignore - qrCodeRef.current doesn't have toDataURL in TypeScript definitions but it exists
      qrCodeRef.current.toDataURL(async (data: string) => {
        try {
          // Create a temporary file
          const fileUri = `${FileSystem.cacheDirectory}qrcode-${userData?.id || 'user'}.png`;
          
          // Convert base64 to file
          await FileSystem.writeAsStringAsync(
            fileUri,
            data.replace('data:image/png;base64,', ''),
            { encoding: FileSystem.EncodingType.Base64 }
          );
          
          // Save to media library
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync('LaJan', asset, false);
          
          Alert.alert('Success', 'QR code saved to your photos!');
        } catch (error) {
          console.error('Error saving image:', error);
          Alert.alert('Error', 'Failed to save QR code to your photos');
        }
      });
    } catch (error) {
      console.error('Error saving QR code:', error);
      Alert.alert('Error', 'Failed to save QR code');
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your QR Code</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.dark} />
            </TouchableOpacity>
          </View>

          <View style={styles.qrContainer}>
            <QRCode
              value={qrCodeData}
              size={qrSize}
              color={colors.dark}
              backgroundColor={colors.light}
              logo={require('@/assets/images/Logo.png')}
              logoSize={logoSize}
              logoBackgroundColor="white"
              logoBorderRadius={10}
              // Increase error correction to make sure QR is still readable with logo
              quietZone={10}
              ecl="H"
              getRef={(ref) => (qrCodeRef.current = ref)}
            />
          </View>

          <Text style={styles.userName}>{userData?.name || 'Your Profile'}</Text>
          <Text style={styles.qrInfo}>
            Share this QR code so others can add you
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
              <Download size={20} color={colors.primary} />
              <Text style={styles.downloadButtonText}>Download</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Share2 size={20} color={colors.light} />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: colors.light,
    borderRadius: 12,
    marginVertical: 16,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: 8,
  },
  qrInfo: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginVertical: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  shareButtonText: {
    color: colors.light,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  downloadButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default QRCodeModal;