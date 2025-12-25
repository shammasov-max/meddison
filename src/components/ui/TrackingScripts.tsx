import { useEffect, useState } from 'react';
import { dataService } from '../../services/dataService';

interface TrackingConfig {
  yandexMetrika: string;
  googleSearchConsole: string;
  googleAnalytics: string;
  customHeadScripts: string;
}

// Utility to safely inject HTML/scripts into document head
const injectToHead = (html: string, id: string) => {
  // Remove existing element if present
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  if (!html || !html.trim()) return;

  // Create a temporary container to parse the HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Create a wrapper element
  const wrapper = document.createElement('div');
  wrapper.id = id;
  wrapper.style.display = 'none';

  // Process each child element
  Array.from(temp.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      
      if (element.tagName === 'SCRIPT') {
        // Scripts need special handling
        const script = document.createElement('script');
        
        // Copy attributes
        Array.from(element.attributes).forEach(attr => {
          script.setAttribute(attr.name, attr.value);
        });
        
        // Copy content
        if (element.textContent) {
          script.textContent = element.textContent;
        }
        
        document.head.appendChild(script);
      } else if (element.tagName === 'META') {
        // Meta tags
        const meta = document.createElement('meta');
        Array.from(element.attributes).forEach(attr => {
          meta.setAttribute(attr.name, attr.value);
        });
        document.head.appendChild(meta);
      } else if (element.tagName === 'NOSCRIPT') {
        // Noscript elements
        const noscript = document.createElement('noscript');
        noscript.innerHTML = element.innerHTML;
        document.head.appendChild(noscript);
      } else if (element.tagName === 'LINK') {
        // Link elements
        const link = document.createElement('link');
        Array.from(element.attributes).forEach(attr => {
          link.setAttribute(attr.name, attr.value);
        });
        document.head.appendChild(link);
      } else if (element.tagName === 'STYLE') {
        // Style elements
        const style = document.createElement('style');
        style.textContent = element.textContent || '';
        document.head.appendChild(style);
      }
    } else if (node.nodeType === Node.COMMENT_NODE) {
      // Preserve comments (optional)
      const comment = document.createComment(node.textContent || '');
      document.head.appendChild(comment);
    }
  });
};

export const TrackingScripts: React.FC = () => {
  const [trackingConfig, setTrackingConfig] = useState<TrackingConfig | null>(null);

  useEffect(() => {
    const loadTrackingConfig = async () => {
      try {
        const content = await dataService.load();
        if ((content as any).trackingConfig) {
          setTrackingConfig((content as any).trackingConfig);
        }
      } catch (error) {
        console.error('Failed to load tracking config:', error);
      }
    };

    loadTrackingConfig();

    // Listen for content updates
    const handleContentUpdate = () => {
      loadTrackingConfig();
    };
    window.addEventListener('data-updated', handleContentUpdate);

    return () => {
      window.removeEventListener('data-updated', handleContentUpdate);
    };
  }, []);

  useEffect(() => {
    if (!trackingConfig) return;

    // Inject Yandex Metrika
    if (trackingConfig.yandexMetrika) {
      injectToHead(trackingConfig.yandexMetrika, 'yandex-metrika-script');
    }

    // Inject Google Search Console verification
    if (trackingConfig.googleSearchConsole) {
      injectToHead(trackingConfig.googleSearchConsole, 'google-search-console-meta');
    }

    // Inject Google Analytics
    if (trackingConfig.googleAnalytics) {
      injectToHead(trackingConfig.googleAnalytics, 'google-analytics-script');
    }

    // Inject custom scripts
    if (trackingConfig.customHeadScripts) {
      injectToHead(trackingConfig.customHeadScripts, 'custom-head-scripts');
    }
  }, [trackingConfig]);

  // This component doesn't render anything visible
  return null;
};
