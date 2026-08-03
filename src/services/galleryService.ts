import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, uploadBase64ToStorage } from './firebase';
import { GalleryImage, Video } from '../types';

const GALLERY_COL = 'gallery';
const VIDEOS_COL = 'videos';

export const galleryService = {
  async list(): Promise<GalleryImage[]> {
    try {
      const q = collection(db, GALLERY_COL);
      const snapshot = await getDocs(q);
      const list: GalleryImage[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as GalleryImage);
      });
      return list.sort((a, b) => a.sort_order - b.sort_order);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, GALLERY_COL);
    }
  },

  async create(image: Omit<GalleryImage, 'id' | 'sort_order'>): Promise<GalleryImage> {
    return this.uploadAndCreate(image.image_url, image.title, image.category);
  },

  async uploadAndCreate(imageUrl: string, title: string, category: string): Promise<GalleryImage> {
    try {
      const list = await this.list();
      const maxSort = list.reduce((max, img) => img.sort_order > max ? img.sort_order : max, 0);

      // Automatically upload if it's base64
      const realUrl = await uploadBase64ToStorage(imageUrl, 'gallery');

      const payload = {
        image_url: realUrl,
        title,
        category,
        sort_order: maxSort + 1,
        created_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, GALLERY_COL), payload);
      return { id: docRef.id, ...payload } as GalleryImage;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, GALLERY_COL);
    }
  },


  async updateTitle(id: string, title: string): Promise<GalleryImage> {
    try {
      const docRef = doc(db, GALLERY_COL, id);
      await updateDoc(docRef, { title });
      const snap = await getDocs(collection(db, GALLERY_COL));
      const found = snap.docs.find(d => d.id === id);
      return { id, ...(found?.data() as GalleryImage), title } as GalleryImage;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${GALLERY_COL}/${id}`);
    }
  },

  async updateTitleAndCategory(id: string, title: string, category: string): Promise<GalleryImage> {
    try {
      const docRef = doc(db, GALLERY_COL, id);
      await updateDoc(docRef, { title, category });
      const snap = await getDocs(collection(db, GALLERY_COL));
      const found = snap.docs.find(d => d.id === id);
      return { id, ...(found?.data() as GalleryImage), title, category } as GalleryImage;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${GALLERY_COL}/${id}`);
    }
  },

  async reorder(orderedImages: GalleryImage[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (let i = 0; i < orderedImages.length; i++) {
        const img = orderedImages[i];
        const docRef = doc(db, GALLERY_COL, img.id);
        batch.update(docRef, { sort_order: i + 1 });
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, GALLERY_COL);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, GALLERY_COL, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${GALLERY_COL}/${id}`);
    }
  }
};

export const videoService = {
  async list(): Promise<Video[]> {
    try {
      const q = collection(db, VIDEOS_COL);
      const snapshot = await getDocs(q);
      const list: Video[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Video);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, VIDEOS_COL);
    }
  },

  async create(video: Omit<Video, 'id'>): Promise<Video> {
    try {
      const list = await this.list();
      const batch = writeBatch(db);

      // Auto-unfeature others if is_featured: true
      if (video.is_featured) {
        list.forEach(v => {
          if (v.is_featured) {
            batch.update(doc(db, VIDEOS_COL, v.id), { is_featured: false });
          }
        });
      }

      // Automatically upload embed_url if it's base64 video file
      const realUrl = await uploadBase64ToStorage(video.embed_url, 'videos');

      const payload = {
        ...video,
        embed_url: realUrl,
        created_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, VIDEOS_COL), payload);
      await batch.commit();

      return { id: docRef.id, ...payload } as Video;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, VIDEOS_COL);
    }
  },

  async update(id: string, updates: Partial<Video>): Promise<Video> {
    try {
      const list = await this.list();
      const batch = writeBatch(db);

      if (updates.is_featured) {
        list.forEach(v => {
          if (v.is_featured && v.id !== id) {
            batch.update(doc(db, VIDEOS_COL, v.id), { is_featured: false });
          }
        });
      }

      // Automatically upload if embed_url has changed to base64
      if (updates.embed_url) {
        updates.embed_url = await uploadBase64ToStorage(updates.embed_url, 'videos');
      }

      const docRef = doc(db, VIDEOS_COL, id);
      batch.update(docRef, updates);
      await batch.commit();

      const snap = await getDocs(collection(db, VIDEOS_COL));
      const found = snap.docs.find(d => d.id === id);
      return { id, ...(found?.data() as Video), ...updates } as Video;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${VIDEOS_COL}/${id}`);
    }
  },

  async toggleFeatured(id: string): Promise<Video> {
    try {
      const list = await this.list();
      const match = list.find(v => v.id === id);
      if (!match) throw new Error('Video not found');
      return this.update(id, { is_featured: !match.is_featured });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${VIDEOS_COL}/${id}`);
    }
  },

  async updateTitle(id: string, title: string): Promise<Video> {
    return this.update(id, { title });
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, VIDEOS_COL, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${VIDEOS_COL}/${id}`);
    }
  }
};
