import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

interface AiSuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
}

export default function AiSuggestions({ suggestions, onSelectSuggestion }: AiSuggestionsProps) {
  return (
    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Bot className="text-blue-600 dark:text-blue-400 w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">AI Content Suggestions</h4>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-3 bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700 hover:bg-blue-25 dark:hover:bg-blue-900"
                  onClick={() => onSelectSuggestion(suggestion)}
                >
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-normal">
                    {suggestion}
                  </p>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
