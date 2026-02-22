import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bot, Send, Loader2 } from "lucide-react";
import { toast } from 'sonner';

export default function MapAssistant({ onResponse }) {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAskTilly = async () => {
        if (!query.trim()) return;
        setIsLoading(true);

        try {
            // Correctly target the /tilly/query endpoint within the router
            const response = await fetch('/functions/router/tilly/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Send only the prompt, as expected by the backend
                body: JSON.stringify({ 
                    prompt: query 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned a non-JSON response. Check function logs.');
            }

            const result = await response.json();
            
            if (result.success && result.matched_fields) {
                onResponse(result.matched_fields);
                toast.success(`Found ${result.matched_fields.length} matching zones: ${result.reasoning}`);
            } else {
                throw new Error(result.error || "Received an invalid response from Tilly");
            }
            
            setQuery(''); // Clear input on success
        } catch (error) {
            console.error("Error with Map Assistant:", error);
            toast.error(`Tilly had trouble understanding that: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-green-900">
                    <Bot className="w-5 h-5" />
                    Map Assistant
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-green-700 mb-3">
                    Ask Tilly to highlight data on the map. Try: "Show fields with NDVI above 0.7" or "Find zones with low pH".
                </p>
                <div className="flex gap-2">
                    <Input 
                        placeholder="e.g., Highlight healthy fields..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAskTilly()}
                    />
                    <Button onClick={handleAskTilly} disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}