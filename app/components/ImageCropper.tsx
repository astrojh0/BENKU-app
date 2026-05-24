import React, { useState, useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Cropper from 'react-easy-crop';
import { Colors } from '../../src/theme';

export interface CropResult {
  file: File;
  base64: string;
}

interface ImageCropperProps {
  visible: boolean;
  imageSrc: string;
  onCancel: () => void;
  onCrop: (result: CropResult) => void;
}

export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not found'));
        return;
      }
      
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const cropWidth = pixelCrop.width * scaleX;
      const cropHeight = pixelCrop.height * scaleY;
      const cropX = pixelCrop.x * scaleX;
      const cropY = pixelCrop.y * scaleY;

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas is empty'));
      }, 'image/jpeg', 0.95);
    };
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = imageSrc;
  });
};

export default function ImageCropper({ visible, imageSrc, onCancel, onCrop }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return;

    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        onCrop({
          file: new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' }),
          base64: (reader.result as string).split(',')[1],
        });
      };
      reader.onerror = () => {
        onCancel();
      };
    } catch (error) {
      console.warn('Crop error:', error);
      onCancel();
    }
  }, [croppedAreaPixels, imageSrc, onCrop, onCancel]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onCancel} style={styles.headerBtn}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
          <Text style={styles.title}>裁切图片</Text>
          <Pressable onPress={handleConfirm} style={styles.headerBtn}>
            <Text style={styles.confirmText}>确认</Text>
          </Pressable>
        </View>

        <View style={styles.cropContainer}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={undefined}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            cropShape="rect"
            showGrid={false}
            objectFit="cover"
            style={styles.cropper}
          />
        </View>

        <View style={styles.controls}>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => setZoom(Math.max(1, zoom - 0.2))}>
            <Text style={styles.zoomBtnText}>-</Text>
          </Pressable>
          <Text style={styles.zoomLabel}>{Math.round(zoom * 100)}%</Text>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => setZoom(Math.min(3, zoom + 0.2))}>
            <Text style={styles.zoomBtnText}>+</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.headerBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  headerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.headerTitle,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent,
  },
  cropContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cropper: {
    containerStyle: {
      backgroundColor: '#000',
    },
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: Colors.headerBg,
    gap: 16,
  },
  zoomLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    minWidth: 50,
    textAlign: 'center',
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomBtnText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
});
