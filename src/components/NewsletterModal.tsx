'use client';

import React, { useState } from 'react';
import { X, Mail, User, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import axios from 'axios';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await axios.post('https://bsd.ai.kr/webhook/landing-form', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        timestamp: new Date().toISOString(),
        source: 'n8n-ai-studio-newsletter'
      });

      setSubmitStatus('success');

      // Reset form after 2 seconds and close modal
      setTimeout(() => {
        setFormData({ name: '', email: '', phone: '' });
        setSubmitStatus('idle');
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Failed to submit form:', error);
      setSubmitStatus('error');
      setErrorMessage(error.response?.data?.message || '제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // 전화번호 입력시 숫자만 허용
    if (name === 'phone') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      setFormData({
        ...formData,
        phone: numbersOnly
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 bg-background-secondary border-border">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">
              📬 n8n 관련 소식 받기
            </h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Message */}
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-500 text-sm font-medium text-center">
                ✅ 구독 신청이 완료되었습니다!
              </p>
            </div>
          )}

          {/* Error Message */}
          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-500 text-sm font-medium text-center">
                ❌ {errorMessage}
              </p>
            </div>
          )}

          {/* Form */}
          {submitStatus !== 'success' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  이름
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="홍길동"
                  className="w-full px-4 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  disabled={isSubmitting}
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="example@email.com"
                  className="w-full px-4 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  disabled={isSubmitting}
                />
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  전화번호 (숫자만 입력)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="01012345678"
                  pattern="[0-9]{10,11}"
                  maxLength={11}
                  className="w-full px-4 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-text-tertiary mt-1">
                  예: 01012345678 (하이픈 없이 입력)
                </p>
              </div>

              {/* Privacy Notice */}
              <p className="text-xs text-text-tertiary">
                제공하신 정보는 n8n 관련 소식 전달 목적으로만 사용되며, 개인정보 보호정책에 따라 안전하게 관리됩니다.
              </p>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    전송 중...
                  </>
                ) : (
                  '구독 신청하기'
                )}
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
