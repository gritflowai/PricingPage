import { useEffect, useRef, useCallback, useState } from 'react';

export interface PricingSelectionData {
  userType: 'cpa' | 'franchisee' | 'smb';
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
  customDiscount?: {
    type: 'percentage' | 'fixed';
    value: number;
    label: string;
    reason: string;
    discountAmount: number;
  } | null;
  royaltyProcessing?: {
    enabled: boolean;
    baseFee: number;
    perTransaction: number;
    estimatedTransactions: number;
    totalFee: number;
  } | null;
  priceBreakdown?: {
    subtotal: number;
    volumeDiscount: number;
    customDiscount: number;
    wholesaleDiscount: number;
    annualSavings: number;
    royaltyProcessingFee?: number;
    finalMonthlyPrice: number;
  };
  planDetails: {
    name: string;
    connections: number;
    users: number;
    scorecards: number | 'unlimited';
    aiTokens: number;
  };
}

// Quote-related message types
export interface QuoteMessageData {
  id: string;
  version?: number;
  pricingModelId?: string | null;
  status?: 'draft' | 'locked' | 'accepted' | 'expired';
  expiresAt?: string | null;
  lockedAt?: string | null;
  selectedPlan?: string;
  count?: number;
  isAnnual?: boolean;
  currency?: string;
  priceBreakdown?: any;
  planDetails?: any;
  selectionRaw?: any;
  expiresInDays?: number;
  acceptedAt?: string;
  payload?: any;
}

export interface QuoteErrorData {
  error: string;
  code?: 'EXPIRED' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN';
  details?: any;
}

export interface IframeMessage {
  type: 'PRICING_SELECTION_UPDATE' | 'USER_ACTION' | 'IFRAME_READY' | 'ENTERPRISE_INQUIRY'
    | 'QUOTE_ID_READY' | 'QUOTE_SUMMARY_UPDATE' | 'QUOTE_LOCKED' | 'QUOTE_ACCEPT_INTENT'
    | 'QUOTE_ACCEPTED' | 'QUOTE_ERROR';
  data?: PricingSelectionData | {
    action: 'START_FREE_TRIAL' | 'CONTACT_SALES' | 'SCHEDULE_MEETING';
    selections: Partial<PricingSelectionData>;
  } | {
    count: number;
    planName: string;
  } | QuoteMessageData | QuoteErrorData;
}

// Incoming message types from parent window
export interface IncomingMessage {
  type: 'CONFIRM_QUOTE_ACCEPTANCE' | 'SET_ADMIN_MODE';
  data?: {
    id?: string;
    acceptedAt?: string;
    enabled?: boolean;
  };
}

interface UseIframeMessagingOptions {
  enabled?: boolean;
  debounceMs?: number;
  isEmbedded?: boolean;
}

export const useIframeMessaging = (options: UseIframeMessagingOptions = {}) => {
  const { enabled = true, debounceMs = 300, isEmbedded = false } = options;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInIframeRef = useRef<boolean>(false);
  const [incomingMessage, setIncomingMessage] = useState<IncomingMessage | null>(null);

  // Detect if running in iframe
  useEffect(() => {
    let detectedInIframe = false;
    let detectionMethod = 'unknown';

    // Priority 1: Use explicit isEmbedded parameter from URL (most reliable)
    if (isEmbedded) {
      detectedInIframe = true;
      detectionMethod = 'url-parameter';
    } else {
      // Priority 2: Fallback to window comparison (less reliable)
      try {
        detectedInIframe = window.self !== window.top;
        detectionMethod = 'window-comparison';
      } catch (e) {
        // If we can't access window.top due to cross-origin, we're definitely in an iframe
        detectedInIframe = true;
        detectionMethod = 'cross-origin-error';
      }
    }

    isInIframeRef.current = detectedInIframe;

    console.log('[PricingCalculator] Iframe detection:', {
      isInIframe: detectedInIframe,
      detectionMethod,
      isEmbeddedParam: isEmbedded,
      enabled,
      timestamp: new Date().toISOString()
    });

    // Send ready message when component mounts
    if (detectedInIframe && enabled) {
      sendMessage({ type: 'IFRAME_READY' });
    }
  }, [enabled, isEmbedded]);

  const sendMessage = useCallback((message: IframeMessage) => {
    if (!enabled || !isInIframeRef.current) {
      console.log('[PricingCalculator] Message not sent (disabled or not in iframe):', message.type);
      return;
    }

    try {
      // Send to parent window
      window.parent.postMessage(message, '*');
      console.log('[PricingCalculator] Sent postMessage:', {
        type: message.type,
        timestamp: new Date().toISOString(),
        data: message.data
      });
    } catch (e) {
      console.error('[PricingCalculator] Failed to send postMessage:', {
        type: message.type,
        error: e,
        timestamp: new Date().toISOString()
      });
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

  // Listen for incoming messages from parent window
  useEffect(() => {
    if (!enabled || !isInIframeRef.current) return;

    const handleIncomingMessage = (event: MessageEvent) => {
      // Basic validation - in production, validate event.origin
      if (!event.data || !event.data.type) return;

      console.log('[PricingCalculator] Received message from parent:', {
        type: event.data.type,
        origin: event.origin,
        timestamp: new Date().toISOString(),
        data: event.data
      });

      // Handle known incoming message types
      if (event.data.type === 'CONFIRM_QUOTE_ACCEPTANCE' || event.data.type === 'SET_ADMIN_MODE') {
        setIncomingMessage(event.data as IncomingMessage);
      }
    };

    window.addEventListener('message', handleIncomingMessage);
    console.log('[PricingCalculator] Message listener registered');

    return () => {
      window.removeEventListener('message', handleIncomingMessage);
      console.log('[PricingCalculator] Message listener unregistered');
    };
  }, [enabled]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Helper function for sending quote messages
  const sendQuoteMessage = useCallback((
    type: 'QUOTE_ID_READY' | 'QUOTE_SUMMARY_UPDATE' | 'QUOTE_LOCKED' | 'QUOTE_ACCEPT_INTENT' | 'QUOTE_ACCEPTED',
    data: QuoteMessageData
  ) => {
    sendMessage({ type, data });
  }, [sendMessage]);

  // Helper function for sending quote errors
  const sendQuoteError = useCallback((error: string, code?: QuoteErrorData['code'], details?: any) => {
    sendMessage({
      type: 'QUOTE_ERROR',
      data: { error, code, details }
    });
  }, [sendMessage]);

  return {
    isInIframe: isInIframeRef.current,
    sendSelectionUpdate,
    sendUserAction,
    sendEnterpriseInquiry,
    sendMessage,
    sendQuoteMessage,
    sendQuoteError,
    incomingMessage,
  };
};
