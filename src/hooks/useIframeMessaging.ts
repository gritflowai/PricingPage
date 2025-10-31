import { useEffect, useRef, useCallback } from 'react';

export interface PricingSelectionData {
  selectedPlan: string;
  count: number;
  isAnnual: boolean;
  finalPrice: number;
  pricePerUnit: number;
  totalPrice: number;
  monthlySavings: number;
  wholesaleDiscountAmount: number;
  resellerCommissionAmount: number;
  wholesaleDiscount: number;
  resellerCommission: number;
  planDetails: {
    name: string;
    connections: number;
    users: number;
    scorecards: number | 'unlimited';
    aiTokens: number;
  };
}

export interface IframeMessage {
  type: 'PRICING_SELECTION_UPDATE' | 'USER_ACTION' | 'IFRAME_READY' | 'ENTERPRISE_INQUIRY';
  data?: PricingSelectionData | {
    action: 'START_FREE_TRIAL' | 'CONTACT_SALES' | 'SCHEDULE_MEETING';
    selections: Partial<PricingSelectionData>;
  } | {
    count: number;
    planName: string;
  };
}

interface UseIframeMessagingOptions {
  enabled?: boolean;
  debounceMs?: number;
}

export const useIframeMessaging = (options: UseIframeMessagingOptions = {}) => {
  const { enabled = true, debounceMs = 300 } = options;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInIframeRef = useRef<boolean>(false);

  // Detect if running in iframe
  useEffect(() => {
    try {
      isInIframeRef.current = window.self !== window.top;
    } catch (e) {
      // If we can't access window.top due to cross-origin, we're definitely in an iframe
      isInIframeRef.current = true;
    }

    // Send ready message when component mounts
    if (isInIframeRef.current && enabled) {
      sendMessage({ type: 'IFRAME_READY' });
    }
  }, [enabled]);

  const sendMessage = useCallback((message: IframeMessage) => {
    if (!enabled || !isInIframeRef.current) return;

    try {
      // Send to parent window
      window.parent.postMessage(message, '*');
    } catch (e) {
      console.error('Failed to send postMessage:', e);
    }
  }, [enabled]);

  const sendSelectionUpdate = useCallback((data: PricingSelectionData) => {
    if (!enabled || !isInIframeRef.current) return;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the message
    debounceTimerRef.current = setTimeout(() => {
      sendMessage({
        type: 'PRICING_SELECTION_UPDATE',
        data,
      });
    }, debounceMs);
  }, [enabled, debounceMs, sendMessage]);

  const sendUserAction = useCallback((
    action: 'START_FREE_TRIAL' | 'CONTACT_SALES' | 'SCHEDULE_MEETING',
    selections: Partial<PricingSelectionData>
  ) => {
    if (!enabled || !isInIframeRef.current) return;

    sendMessage({
      type: 'USER_ACTION',
      data: {
        action,
        selections,
      },
    });
  }, [enabled, sendMessage]);

  const sendEnterpriseInquiry = useCallback((count: number, planName: string) => {
    if (!enabled || !isInIframeRef.current) return;

    sendMessage({
      type: 'ENTERPRISE_INQUIRY',
      data: {
        count,
        planName,
      },
    });
  }, [enabled, sendMessage]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    isInIframe: isInIframeRef.current,
    sendSelectionUpdate,
    sendUserAction,
    sendEnterpriseInquiry,
    sendMessage,
  };
};
