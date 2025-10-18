'use client';

import { useEffect, useState, useRef } from 'react';

interface SelectedElement {
  id: string;
  type: string;
  label: string;
  widgetType?: string;
  settings?: any;
}

interface ElementorContext {
  isElementorEditor: boolean;
  selectedElement: SelectedElement | null;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'angie';
  timestamp: Date;
}

export default function AngiePage() {
  const [isReady, setIsReady] = useState(false);
  const [elementorContext, setElementorContext] = useState<ElementorContext>({
    isElementorEditor: false,
    selectedElement: null,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Notify parent window that iframe is ready
    const notifyParent = () => {
      if (window.parent !== window) {
        window.parent.postMessage(
          { 
            type: 'ANGIE_IFRAME_READY',
            timestamp: Date.now()
          },
          '*'
        );
        console.log('Sent ANGIE_IFRAME_READY to parent');
      }
    };

    // Request current Elementor context
    const requestElementorContext = () => {
      if (window.parent !== window) {
        window.parent.postMessage(
          { 
            type: 'GET_ELEMENTOR_CONTEXT',
            timestamp: Date.now()
          },
          '*'
        );
      }
    };

    // Listen for messages from parent window
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      switch (event.data.type) {
        case 'focusInput':
          const input = document.querySelector('input');
          if (input) {
            input.focus();
          }
          break;

        case 'ELEMENTOR_CONTEXT':
          setElementorContext(event.data.payload || {
            isElementorEditor: false,
            selectedElement: null,
          });
          break;

        case 'ELEMENT_SELECTED':
          setElementorContext(prev => ({
            ...prev,
            selectedElement: event.data.payload,
          }));
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    notifyParent();
    setIsReady(true);
    setTimeout(requestElementorContext, 500);

    const contextInterval = setInterval(requestElementorContext, 5000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(contextInterval);
    };
  }, []);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // Simulate Angie response
    setTimeout(() => {
      const angieMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `I understand you want: "${inputValue}". This is a demo response. AI integration coming soon!`,
        sender: 'angie',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, angieMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#f5f5f7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>
              🤖
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
              }}>
                Angie AI Assistant
              </h1>
              <p style={{
                margin: 0,
                fontSize: '12px',
                opacity: 0.9,
              }}>
                {isReady ? (
                  <>✓ Connected {elementorContext.isElementorEditor && '• Elementor Active'}</>
                ) : (
                  'Connecting...'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Element Info - Fixed Position */}
      {elementorContext.selectedElement && (
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '12px 20px',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
          }}>
            <span style={{
              fontSize: '16px',
            }}>🎯</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: '600',
                color: '#333',
              }}>
                {elementorContext.selectedElement.label}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#666',
                marginTop: '2px',
              }}>
                {elementorContext.selectedElement.type}
                {elementorContext.selectedElement.widgetType && 
                  ` • ${elementorContext.selectedElement.widgetType}`
                }
              </div>
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '10px',
              background: '#f0f0f0',
              padding: '4px 8px',
              borderRadius: '4px',
              color: '#666',
            }}>
              #{elementorContext.selectedElement.id.substring(0, 8)}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area - Scrollable */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#999',
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
            }}>💬</div>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#666',
            }}>
              Start a conversation with Angie
            </h3>
            <p style={{
              margin: 0,
              fontSize: '13px',
            }}>
              Ask me anything about your WordPress site
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '75%',
                  padding: '10px 14px',
                  borderRadius: '16px',
                  background: msg.sender === 'user' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'white',
                  color: msg.sender === 'user' ? 'white' : '#333',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area - Fixed Bottom */}
      <div style={{
        background: 'white',
        borderTop: '1px solid #e0e0e0',
        padding: '16px 20px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
        }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Angie anything..."
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '24px',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
              background: '#f9f9f9',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.background = 'white';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e0e0e0';
              e.target.style.background = '#f9f9f9';
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            style={{
              padding: '12px 24px',
              background: inputValue.trim() 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#e0e0e0',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim()) {
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Send
          </button>
        </div>
        <div style={{
          marginTop: '8px',
          fontSize: '11px',
          color: '#999',
          textAlign: 'center',
        }}>
          Press Enter to send • Powered by Next.js 15
        </div>
      </div>
    </div>
  );
}


