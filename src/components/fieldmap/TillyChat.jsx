import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, Send, Loader2, MessageSquare, X } from "lucide-react";
import { toast } from 'sonner';

// Import the working function directly
import { queryTilly } from "@/api/functions";

export default function TillyChat({ onResponse }) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded
  const [chatHistory, setChatHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = { type: 'user', content: query, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Use the imported function directly
      const response = await queryTilly({ prompt: query });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const result = response.data;
      
      if (result.success && result.matched_fields) {
        const botMessage = {
          type: 'bot',
          content: result.reasoning || `Found ${result.matched_fields.length} matching fields`,
          timestamp: new Date(),
          fieldCount: result.matched_fields.length
        };
        
        setChatHistory(prev => [...prev, botMessage]);
        onResponse(result.matched_fields);
        toast.success(`Highlighted ${result.matched_fields.length} fields on the map`);
      } else {
        throw new Error('Invalid response from Tilly');
      }
      
      setQuery('');
    } catch (error) {
      console.error('Tilly query error:', error);
      const errorMessage = {
        type: 'bot',
        content: `Sorry, I couldn't process that request: ${error.message}`,
        timestamp: new Date(),
        isError: true
      };
      setChatHistory(prev => [...prev, errorMessage]);
      toast.error(`Tilly couldn't help: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Show fields with NDVI above 0.7",
    "Find zones with low soil pH",
    "Highlight fields with high ET",
    "Show unhealthy zones",
    "Find fields needing attention"
  ];

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    if (!isExpanded) setIsExpanded(true);
  };

  return (
    <Card className="border-none shadow-xl bg-white/95 backdrop-blur-sm">
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-lg font-bold text-green-900">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Tilly AI Assistant
          </div>
          <div className="flex items-center gap-2">
            {chatHistory.length > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                {chatHistory.length}
              </span>
            )}
            {isExpanded ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2 bg-gray-50 rounded-lg p-3">
              {chatHistory.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-2 rounded-lg text-sm ${
                    message.type === 'user' 
                      ? 'bg-green-600 text-white' 
                      : message.isError
                      ? 'bg-red-100 text-red-800'
                      : 'bg-white text-gray-800 border'
                  }`}>
                    {message.content}
                    {message.fieldCount !== undefined && (
                      <div className="text-xs mt-1 opacity-75">
                        {message.fieldCount} fields highlighted
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Input 
                placeholder="e.g., Show fields with NDVI above 0.7"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !query.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Quick Suggestions */}
            {!isLoading && chatHistory.length === 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Try asking:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

        </CardContent>
      )}
    </Card>
  );
}