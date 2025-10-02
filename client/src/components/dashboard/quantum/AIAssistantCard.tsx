import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import OpenChatButton from '@/components/ai/OpenChatButton';

export function AIAssistantCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Bot className="h-5 w-5 text-purple-600" />
          </motion.div>
          AI Assistant
        </CardTitle>
        <CardDescription>
          Your AI advisor is watching and ready to help
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              "I've analyzed your business health and identified 3 key areas for improvement..."
            </p>
          </div>
          <OpenChatButton className="w-full" label="Chat with AI" />
        </div>
      </CardContent>
    </Card>
  );
}
