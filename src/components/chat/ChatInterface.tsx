'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, CheckCircle2, XCircle, Settings, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import type { ChatMessage, IntentAnalysis, N8nWorkflow } from '@/types';
import axios from 'axios';

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! 👋 BSD n8n AI Dev Studio입니다.\n\n어떤 자동화를 만들고 싶으신가요? 자연어로 편하게 말씀해주세요!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get AI provider and API key from localStorage
      const aiProvider = localStorage.getItem('ai_provider') || 'openai';
      const openaiKey = localStorage.getItem('openai_api_key');
      const xaiKey = localStorage.getItem('xai_api_key');
      const geminiKey = localStorage.getItem('gemini_api_key');
      const anthropicKey = localStorage.getItem('anthropic_api_key');
      const deepseekKey = localStorage.getItem('deepseek_api_key');

      // Select the appropriate API key based on provider
      let apiKey = '';
      if (aiProvider === 'openai') apiKey = openaiKey || '';
      else if (aiProvider === 'xai') apiKey = xaiKey || '';
      else if (aiProvider === 'gemini') apiKey = geminiKey || '';
      else if (aiProvider === 'anthropic') apiKey = anthropicKey || '';
      else if (aiProvider === 'deepseek') apiKey = deepseekKey || '';

      // 1. AI Intent 분석
      const analysisResponse = await axios.post('/api/analyze-intent', {
        input: userInput
      }, {
        headers: {
          'x-ai-provider': aiProvider,
          'x-api-key': apiKey
        }
      });

      if (!analysisResponse.data.success) {
        throw new Error(analysisResponse.data.error?.message || 'Intent 분석 실패');
      }

      const analysis: IntentAnalysis = analysisResponse.data.data;

      const analysisMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `✅ 분석 완료!\n\n워크플로우를 생성할 준비가 되었습니다.`,
        timestamp: new Date(),
        metadata: {
          intent_analysis: analysis
        }
      };

      setMessages(prev => [...prev, analysisMessage]);
    } catch (error: any) {
      console.error('Failed to process message:', error);

      // Get provider name for error message
      const aiProvider = localStorage.getItem('ai_provider') || 'openai';
      const providerNames: Record<string, string> = {
        openai: 'OpenAI',
        deepseek: 'DeepSeek',
        xai: 'xAI',
        gemini: 'Google Gemini',
        anthropic: 'Anthropic'
      };
      const providerName = providerNames[aiProvider] || 'AI';

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `❌ 오류가 발생했습니다.\n\n${error.response?.data?.error?.message || error.message || '알 수 없는 오류'}\n\n💡 Settings에서 ${providerName} API Key를 확인해주세요.\n현재 선택된 제공업체: ${providerName}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWorkflow = async (analysis: IntentAnalysis, userInput: string) => {
    setIsLoading(true);

    try {
      let finalAnalysis = analysis;

      // If userInput is provided, it's a modification request
      if (userInput && userInput.trim()) {
        const aiProvider = localStorage.getItem('ai_provider') || 'openai';
        const openaiKey = localStorage.getItem('openai_api_key');
        const xaiKey = localStorage.getItem('xai_api_key');
        const geminiKey = localStorage.getItem('gemini_api_key');
        const anthropicKey = localStorage.getItem('anthropic_api_key');
        const deepseekKey = localStorage.getItem('deepseek_api_key');

        let apiKey = '';
        if (aiProvider === 'openai') apiKey = openaiKey || '';
        else if (aiProvider === 'xai') apiKey = xaiKey || '';
        else if (aiProvider === 'gemini') apiKey = geminiKey || '';
        else if (aiProvider === 'anthropic') apiKey = anthropicKey || '';
        else if (aiProvider === 'deepseek') apiKey = deepseekKey || '';

        // Add user's modification request message
        const modifyRequestMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: `🔧 수정 요청: ${userInput}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, modifyRequestMessage]);

        // Call modify-intent API
        const modifyResponse = await axios.post('/api/modify-intent', {
          originalAnalysis: analysis,
          modificationRequest: userInput
        }, {
          headers: {
            'x-ai-provider': aiProvider,
            'x-api-key': apiKey
          }
        });

        if (!modifyResponse.data.success) {
          throw new Error(modifyResponse.data.error?.message || '수정 분석 실패');
        }

        finalAnalysis = modifyResponse.data.data;

        // Show modified analysis result
        const modifiedAnalysisMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `✅ 수정된 분석 결과입니다.`,
          timestamp: new Date(),
          metadata: {
            intent_analysis: finalAnalysis
          }
        };
        setMessages(prev => [...prev, modifiedAnalysisMessage]);
      }

      // 2. 워크플로우 생성 (AI provider와 API key 전달)
      const aiProvider = localStorage.getItem('ai_provider') || 'openai';
      const openaiKey = localStorage.getItem('openai_api_key');
      const xaiKey = localStorage.getItem('xai_api_key');
      const geminiKey = localStorage.getItem('gemini_api_key');
      const anthropicKey = localStorage.getItem('anthropic_api_key');
      const deepseekKey = localStorage.getItem('deepseek_api_key');

      let apiKey = '';
      if (aiProvider === 'openai') apiKey = openaiKey || '';
      else if (aiProvider === 'xai') apiKey = xaiKey || '';
      else if (aiProvider === 'gemini') apiKey = geminiKey || '';
      else if (aiProvider === 'anthropic') apiKey = anthropicKey || '';
      else if (aiProvider === 'deepseek') apiKey = deepseekKey || '';

      const workflowResponse = await axios.post('/api/generate-workflow', {
        intent_analysis: finalAnalysis,
        user_input: userInput || ''
      }, {
        headers: {
          'x-ai-provider': aiProvider,
          'x-api-key': apiKey
        }
      });

      if (!workflowResponse.data.success) {
        throw new Error(workflowResponse.data.error?.message || '워크플로우 생성 실패');
      }

      const workflowData = workflowResponse.data.data;

      const workflowMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `🎉 워크플로우가 생성되었습니다!\n\n복잡도: ${workflowData.estimated_complexity}\n노드 수: ${workflowData.workflow_json.nodes.length}개`,
        timestamp: new Date(),
        metadata: {
          workflow_preview: workflowData.workflow_json,
          intent_analysis: finalAnalysis
        }
      };

      setMessages(prev => [...prev, workflowMessage]);

      // 3. n8n에 자동 배포 시도 (설정되어 있다면)
      const n8nUrl = localStorage.getItem('n8n_instance_url');
      const n8nApiKey = localStorage.getItem('n8n_api_key');

      if (n8nUrl && n8nApiKey) {
        await handleDeployWorkflow(workflowData.workflow_json, n8nUrl, n8nApiKey);
      } else {
        const infoMessage: ChatMessage = {
          id: (Date.now() + 3).toString(),
          role: 'system',
          content: '💡 n8n 설정이 없어 배포를 건너뛰었습니다.\n\nSettings에서 n8n 연결 정보를 설정하면 자동 배포됩니다.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, infoMessage]);
      }
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'system',
        content: `❌ 워크플로우 생성 실패\n\n${error.response?.data?.error?.message || error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployWorkflow = async (workflow: N8nWorkflow, n8nUrl: string, apiKey: string) => {
    try {
      const deployResponse = await axios.post('/api/deploy-workflow', {
        workflow_json: workflow,
        n8n_instance: n8nUrl,
        api_key: apiKey
      });

      if (!deployResponse.data.success) {
        throw new Error(deployResponse.data.error?.message || '배포 실패');
      }

      const deployData = deployResponse.data.data;

      const successMessage: ChatMessage = {
        id: (Date.now() + 4).toString(),
        role: 'assistant',
        content: `✅ n8n에 성공적으로 배포되었습니다!\n\nWorkflow ID: ${deployData.workflow_id}\n${deployData.webhook_url ? `Webhook URL: ${deployData.webhook_url}` : ''}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, successMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 4).toString(),
        role: 'system',
        content: `❌ n8n 배포 실패\n\n${error.response?.data?.error?.message || error.message}\n\nn8n이 실행 중인지, API Key가 올바른지 확인해주세요.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background-primary">
      {/* Header */}
      <div className="border-b border-border bg-background-secondary px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">BSD n8n AI Dev Studio</h1>
          <p className="text-sm text-text-secondary mt-1">AI가 n8n 워크플로우를 대신 만들어드립니다</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          className="ml-4"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onGenerate={handleGenerateWorkflow}
            isLoading={isLoading}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-text-secondary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI가 분석 중입니다...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background-secondary px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="예: Gmail 신규 메일 오면 슬랙으로 전송..."
              className="min-h-[60px] max-h-[200px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="lg"
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Quick Examples */}
          <div className="mt-3 flex flex-wrap gap-2">
            {['Gmail → Slack 알림', '쇼핑몰 주문 → 구글시트', '매일 9시 리포트'].map((example) => (
              <button
                key={example}
                onClick={() => setInput(example)}
                disabled={isLoading}
                className="px-3 py-1 text-xs rounded-full bg-background-tertiary text-text-secondary hover:bg-border hover:text-text-primary transition-colors disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onGenerate,
  isLoading
}: {
  message: ChatMessage;
  onGenerate: (analysis: IntentAnalysis, userInput: string) => void;
  isLoading: boolean;
}) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-accent-primary' : isSystem ? 'bg-accent-warning' : 'bg-accent-purple'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div className={`max-w-2xl ${isUser ? 'text-right' : ''}`}>
          {/* Message Text */}
          <Card className={`p-4 ${
            isUser
              ? 'bg-accent-primary text-white border-accent-primary'
              : isSystem
              ? 'bg-background-tertiary border-border'
              : 'bg-background-secondary border-border'
          }`}>
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>

            {/* Intent Analysis Preview */}
            {message.metadata?.intent_analysis && (
              <IntentPreview
                analysis={message.metadata.intent_analysis}
                onGenerate={onGenerate}
                isLoading={isLoading}
              />
            )}

            {/* Workflow Preview */}
            {message.metadata?.workflow_preview && (
              <WorkflowPreview workflow={message.metadata.workflow_preview} />
            )}
          </Card>

          {/* Timestamp */}
          <p className="text-xs text-text-tertiary mt-1 px-1">
            {message.timestamp.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

function IntentPreview({
  analysis,
  onGenerate,
  isLoading
}: {
  analysis: IntentAnalysis;
  onGenerate: (analysis: IntentAnalysis, userInput: string) => void;
  isLoading: boolean;
}) {
  const [isModifying, setIsModifying] = useState(false);
  const [modifyRequest, setModifyRequest] = useState('');

  const handleModifySubmit = () => {
    if (modifyRequest.trim()) {
      onGenerate(analysis, modifyRequest.trim());
      setModifyRequest('');
      setIsModifying(false);
    }
  };

  return (
    <div className="mt-4 p-3 rounded-lg bg-background-primary/10 border border-white/10">
      <p className="text-xs font-semibold mb-2">🎯 분석 결과</p>
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-white/70">의도:</span>
          <span className="font-medium">{analysis.intent}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/70">복잡도:</span>
          <span className="font-medium">{analysis.complexity}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/70">필요 노드:</span>
          <span className="font-medium">{analysis.estimated_nodes}개</span>
        </div>
      </div>

      {isModifying && (
        <div className="mt-3">
          <input
            type="text"
            value={modifyRequest}
            onChange={(e) => setModifyRequest(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleModifySubmit()}
            placeholder="예: 슬랙 대신 디스코드로 보내줘"
            className="w-full px-3 py-2 text-xs bg-background-primary/20 border border-white/20 rounded-lg focus:outline-none focus:border-accent-primary"
            autoFocus
          />
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={() => onGenerate(analysis, '')}
          disabled={isLoading || isModifying}
          className="text-xs"
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          생성하기
        </Button>
        {!isModifying ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs"
            disabled={isLoading}
            onClick={() => setIsModifying(true)}
          >
            수정 요청
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={handleModifySubmit}
              disabled={!modifyRequest.trim()}
            >
              <Check className="w-3 h-3 mr-1" />
              적용
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => {
                setIsModifying(false);
                setModifyRequest('');
              }}
            >
              <X className="w-3 h-3 mr-1" />
              취소
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function WorkflowPreview({ workflow }: { workflow: N8nWorkflow }) {
  return (
    <div className="mt-4 p-3 rounded-lg bg-background-primary/10 border border-white/10">
      <p className="text-xs font-semibold mb-2">📊 워크플로우 미리보기</p>
      <div className="flex items-center gap-2 text-xs flex-wrap">
        {workflow.nodes.map((node, i) => (
          <React.Fragment key={node.id}>
            <div className="px-2 py-1 rounded bg-white/10">
              {node.name}
            </div>
            {i < workflow.nodes.length - 1 && (
              <span className="text-white/50">→</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [aiProvider, setAiProvider] = useState(localStorage.getItem('ai_provider') || 'openai');
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [xaiKey, setXaiKey] = useState(localStorage.getItem('xai_api_key') || '');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [anthropicKey, setAnthropicKey] = useState(localStorage.getItem('anthropic_api_key') || '');
  const [deepseekKey, setDeepseekKey] = useState(localStorage.getItem('deepseek_api_key') || '');
  const [n8nUrl, setN8nUrl] = useState(localStorage.getItem('n8n_instance_url') || 'http://localhost:5678');
  const [n8nApiKey, setN8nApiKey] = useState(localStorage.getItem('n8n_api_key') || '');

  const handleSave = () => {
    localStorage.setItem('ai_provider', aiProvider);
    localStorage.setItem('openai_api_key', openaiKey);
    localStorage.setItem('xai_api_key', xaiKey);
    localStorage.setItem('gemini_api_key', geminiKey);
    localStorage.setItem('anthropic_api_key', anthropicKey);
    localStorage.setItem('deepseek_api_key', deepseekKey);
    localStorage.setItem('n8n_instance_url', n8nUrl);
    localStorage.setItem('n8n_api_key', n8nApiKey);
    alert('✅ 설정이 저장되었습니다!');
    onClose();
  };

  return (
    <div className="border-b border-border bg-background-secondary px-6 py-4">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-text-primary mb-4">⚙️ Settings</h2>

        <div className="space-y-4">
          {/* AI Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              🤖 AI Provider
            </label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="deepseek">DeepSeek (Chat)</option>
              <option value="xai">xAI (Grok)</option>
              <option value="gemini">Google Gemini (2.5 Flash)</option>
              <option value="anthropic">Anthropic (Claude)</option>
            </select>
          </div>

          {/* OpenAI API Key */}
          {aiProvider === 'openai' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
              <p className="text-xs text-text-tertiary mt-1">
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                  OpenAI에서 발급받기
                </a>
              </p>
            </div>
          )}

          {/* xAI API Key */}
          {aiProvider === 'xai' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                xAI API Key
              </label>
              <input
                type="password"
                value={xaiKey}
                onChange={(e) => setXaiKey(e.target.value)}
                placeholder="xai-..."
                className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
              <p className="text-xs text-text-tertiary mt-1">
                <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                  xAI에서 발급받기
                </a>
              </p>
            </div>
          )}

          {/* Gemini API Key */}
          {aiProvider === 'gemini' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
              <p className="text-xs text-text-tertiary mt-1">
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                  Google AI Studio에서 발급받기
                </a>
              </p>
            </div>
          )}

          {/* Anthropic API Key */}
          {aiProvider === 'anthropic' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Anthropic API Key
              </label>
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
              <p className="text-xs text-text-tertiary mt-1">
                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                  Anthropic에서 발급받기
                </a>
              </p>
            </div>
          )}

          {/* DeepSeek API Key */}
          {aiProvider === 'deepseek' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                DeepSeek API Key
              </label>
              <input
                type="password"
                value={deepseekKey}
                onChange={(e) => setDeepseekKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
              <p className="text-xs text-text-tertiary mt-1">
                <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                  DeepSeek에서 발급받기
                </a>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              n8n Instance URL
            </label>
            <input
              type="text"
              value={n8nUrl}
              onChange={(e) => setN8nUrl(e.target.value)}
              placeholder="http://localhost:5678"
              className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              n8n API Key
            </label>
            <input
              type="password"
              value={n8nApiKey}
              onChange={(e) => setN8nApiKey(e.target.value)}
              placeholder="n8n API Key"
              className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>
              저장
            </Button>
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
