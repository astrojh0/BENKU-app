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

export default function ImageCropper({ visible, imageSrc, onCancel, onCrop }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<CropResult> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('No 2d context');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onload = () => {
            resolve({
              file: new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' }),
              base64: (reader.result as string).split(',')[1],
            });
          };
          reader.onerror = () => {
            reject(new Error('Failed to read blob'));
          };
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    };

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    
    try {
      const result = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCrop(result);
    } catch (error) {
      console.error('Crop error:', error);
      onCancel();
    }
  };

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
          <Text style={styles.zoomLabel}>缩放</Text>
          <View style={styles.zoomContainer}>
            <Text style={styles.zoomText}>-</Text>
            <View style={styles.slider}>
              <View 
                style={[
                  styles.sliderFill, 
                  { width: `${((zoom - 1) / 2) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.zoomText}>+</Text>
          </View>
          <Pressable 
            style={styles.zoomBtn}
            onPress={() => setZoom(Math.max(1, zoom - 0.2))}>
            <Text style={styles.zoomBtnText}>-</Text>
          </Pressable>
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
    gap: 12,
  },
  zoomLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  zoomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoomText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  slider: {
    width: 100,
    height: 4,
    backgroundColor: Colors.divider,
    borderRadius: 2,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
});
