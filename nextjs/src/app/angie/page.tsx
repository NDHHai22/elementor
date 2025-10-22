'use client';

import { useEffect, useState, useRef } from 'react';
import { htmlToElementorJSON, elementorJSONToHTML } from '@/lib/elementor-converter';

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

type ActiveTab = 'chat' | 'converter';

export default function AngiePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [isReady, setIsReady] = useState(false);
  const [elementorContext, setElementorContext] = useState<ElementorContext>({
    isElementorEditor: false,
    selectedElement: null,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Converter states
  const [htmlInput, setHtmlInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [convertedOutput, setConvertedOutput] = useState('');
  const [insertStatus, setInsertStatus] = useState<{type: 'success' | 'error' | 'info' | null, message: string}>({
    type: null,
    message: '',
  });

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

        case 'INSERT_ELEMENTS_RESPONSE':
          // Handle insert response from WordPress
          const response = event.data.payload;
          if (response.success) {
            setInsertStatus({
              type: 'success',
              message: response.message || 'Elements inserted successfully!',
            });
            // Clear converted output after successful insert
            setTimeout(() => {
              setConvertedOutput('');
              setHtmlInput('');
              setJsonInput('');
            }, 2000);
          } else {
            setInsertStatus({
              type: 'error',
              message: response.message || 'Failed to insert elements',
            });
          }
          // Clear status after 5 seconds
          setTimeout(() => {
            setInsertStatus({ type: null, message: '' });
          }, 5000);
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

  // Converter functions
  const handleHTMLToJSON = () => {
    try {
      setInsertStatus({ type: null, message: '' });
      const elements = htmlToElementorJSON(htmlInput);
      setConvertedOutput(JSON.stringify(elements, null, 2));
      setInsertStatus({
        type: 'success',
        message: `✅ Converted to ${elements.length} Elementor element(s)`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setConvertedOutput(`Error: ${errorMsg}`);
      setInsertStatus({
        type: 'error',
        message: `❌ Conversion failed: ${errorMsg}`,
      });
    }
  };

  const handleJSONToHTML = () => {
    try {
      setInsertStatus({ type: null, message: '' });
      const elements = JSON.parse(jsonInput);
      const html = elementorJSONToHTML(elements);
      setConvertedOutput(html);
      setInsertStatus({
        type: 'success',
        message: '✅ Converted to HTML successfully',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setConvertedOutput(`Error: ${errorMsg}`);
      setInsertStatus({
        type: 'error',
        message: `❌ Conversion failed: ${errorMsg}`,
      });
    }
  };

  const handleInsertToElementor = () => {
    try {
      setInsertStatus({ type: 'info', message: '⏳ Inserting elements...' });
      
      const elements = JSON.parse(convertedOutput);
      
      // Validate elements structure
      if (!Array.isArray(elements)) {
        throw new Error('Invalid format: Expected array of elements');
      }

      // Send to parent window
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'INSERT_ELEMENTOR_ELEMENTS',
          payload: elements,
        }, '*');
        
        console.log('📤 Sent INSERT_ELEMENTOR_ELEMENTS:', elements);
      } else {
        throw new Error('Not in iframe - cannot insert to Elementor');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setInsertStatus({
        type: 'error',
        message: `❌ ${errorMsg}`,
      });
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '16px 20px',
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
        
        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderTop: '1px solid rgba(255,255,255,0.2)',
        }}>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'chat' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: 'white',
              border: 'none',
              borderBottom: activeTab === 'chat' ? '2px solid white' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab('converter')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'converter' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: 'white',
              border: 'none',
              borderBottom: activeTab === 'converter' ? '2px solid white' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
          >
            🔄 Converter
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'chat' && (
        <>
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
        </>
      )}

      {/* Converter View */}
      {activeTab === 'converter' && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          gap: '16px',
          overflowY: 'auto',
        }}>
          {/* Status Message */}
          {insertStatus.type && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              background: 
                insertStatus.type === 'success' ? '#d1fae5' :
                insertStatus.type === 'error' ? '#fee2e2' :
                '#dbeafe',
              color:
                insertStatus.type === 'success' ? '#065f46' :
                insertStatus.type === 'error' ? '#991b1b' :
                '#1e40af',
              border: `1px solid ${
                insertStatus.type === 'success' ? '#10b981' :
                insertStatus.type === 'error' ? '#ef4444' :
                '#3b82f6'
              }`,
              animation: 'slideIn 0.3s ease-out',
            }}>
              {insertStatus.message}
            </div>
          )}

          {/* Input Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}>
            {/* HTML Input */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#4b5563',
              }}>
                📝 HTML Input
              </label>
              <textarea
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                placeholder="Paste your HTML here..."
                style={{
                  flex: 1,
                  minHeight: '200px',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>

            {/* JSON Input */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#4b5563',
              }}>
                📋 JSON Input
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your Elementor JSON here..."
                style={{
                  flex: 1,
                  minHeight: '200px',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={handleHTMLToJSON}
              disabled={!htmlInput.trim()}
              style={{
                padding: '10px 20px',
                background: htmlInput.trim() ? '#3b82f6' : '#e5e7eb',
                color: htmlInput.trim() ? 'white' : '#9ca3af',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: htmlInput.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              HTML → JSON
            </button>
            <button
              onClick={handleJSONToHTML}
              disabled={!jsonInput.trim()}
              style={{
                padding: '10px 20px',
                background: jsonInput.trim() ? '#10b981' : '#e5e7eb',
                color: jsonInput.trim() ? 'white' : '#9ca3af',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: jsonInput.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              JSON → HTML
            </button>
            <button
              onClick={handleInsertToElementor}
              disabled={!convertedOutput.trim() || !elementorContext.isElementorEditor}
              style={{
                padding: '10px 20px',
                background: convertedOutput.trim() && elementorContext.isElementorEditor ? '#8b5cf6' : '#e5e7eb',
                color: convertedOutput.trim() && elementorContext.isElementorEditor ? 'white' : '#9ca3af',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: convertedOutput.trim() && elementorContext.isElementorEditor ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              📤 Insert to Elementor
            </button>
          </div>

          {/* Output Section */}
          {convertedOutput && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#4b5563',
              }}>
                ✨ Converted Output
              </label>
              <textarea
                value={convertedOutput}
                readOnly
                style={{
                  minHeight: '200px',
                  padding: '12px',
                  border: '2px solid #10b981',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  outline: 'none',
                  background: '#f0fdf4',
                }}
              />
            </div>
          )}

          {/* Info Box */}
          {!elementorContext.isElementorEditor && (
            <div style={{
              padding: '12px',
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#92400e',
            }}>
              ⚠️ Elementor editor not detected. "Insert to Elementor" will be disabled.
            </div>
          )}
        </div>
      )}
    </div>
  );
}


