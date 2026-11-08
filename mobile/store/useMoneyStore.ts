import { create } from 'zustand';
import type { MoneySummary, CreateIncomeRequest, Notification } from '../types';
import { apiClient } from '../services/api';
import { parseWalletSpend } from '../utils/walletSpend';

interface MoneyStore {
  data: MoneySummary | null;
  loading: boolean;
  error: string | null;
  
  fetchMoneySummary: () => Promise<void>;
  createIncome: (request: CreateIncomeRequest) => Promise<void>;
  ingestWalletNotifications: (notifications?: Notification[]) => Promise<void>;
  reset: () => void;
}

export const useMoneyStore = create<MoneyStore>((set, get) => ({
  data: null,
  loading: false,
  error: null,

  fetchMoneySummary: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiClient.getMoneySummary();
      set({ data, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load money summary',
        loading: false 
      });
    }
  },

  createIncome: async (request: CreateIncomeRequest) => {
    try {
      await apiClient.createIncome(request);
      await get().fetchMoneySummary(); // Refresh data
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create income entry'
      });
    }
  },

  ingestWalletNotifications: async (notifications) => {
    try {
      const inbox =
        notifications ??
        (await apiClient.getNotifications({ limit: 100 })).notifications;
      const known = new Set(
        (get().data?.walletSpend ?? []).map((item) => item.sourceNotificationId)
      );
      let wrote = false;
      for (const notification of inbox) {
        const spend = parseWalletSpend(notification);
        if (!spend || known.has(spend.sourceNotificationId)) {
          continue;
        }
        await apiClient.createWalletSpend(spend);
        known.add(spend.sourceNotificationId);
        wrote = true;
      }
      if (wrote || !get().data) {
        await get().fetchMoneySummary();
      }
    } catch (error) {
      console.warn('Could not ingest Google Wallet payments', error);
    }
  },

  reset: () => {
    set({ data: null, loading: false, error: null });
  },
}));
