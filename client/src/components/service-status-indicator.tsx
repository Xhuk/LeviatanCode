import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";

interface ServiceStatusIndicatorProps {
  service: "openai" | "gemini";
  model?: string;
}

interface ServiceLimits {
  requestsPerMinute: number;
  requestsPerDay: number;
  tokensPerMinute: number;
  currentUsage: number;
  dailyUsage: number;
}

export function ServiceStatusIndicator({ service, model }: ServiceStatusIndicatorProps) {
  const [status, setStatus] = useState<"available" | "limited" | "unavailable">("available");
  const [limits, setLimits] = useState<ServiceLimits | null>(null);

  // Mock service limits for demonstration - in real app, this would come from API
  const serviceLimits: Record<string, ServiceLimits> = {
    openai: {
      requestsPerMinute: 3,
      requestsPerDay: 200,
      tokensPerMinute: 40000,
      currentUsage: 2, // Current requests this minute
      dailyUsage: 45,  // Requests used today
    },
    gemini: {
      requestsPerMinute: 15,
      requestsPerDay: 1500,
      tokensPerMinute: 32000,
      currentUsage: 8,
      dailyUsage: 234,
    }
  };

  useEffect(() => {
    const serviceLimit = serviceLimits[service];
    setLimits(serviceLimit);

    // Determine status based on usage
    if (serviceLimit.currentUsage >= serviceLimit.requestsPerMinute) {
      setStatus("unavailable");
    } else if (serviceLimit.dailyUsage > serviceLimit.requestsPerDay * 0.8) {
      setStatus("limited");
    } else {
      setStatus("available");
    }
  }, [service]);

  const getStatusInfo = () => {
    switch (status) {
      case "available":
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          color: "bg-green-50 border-green-200 text-green-800",
          label: "Available",
          message: "Service is running normally"
        };
      case "limited":
        return {
          icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
          color: "bg-yellow-50 border-yellow-200 text-yellow-800",
          label: "Limited",
          message: "Approaching daily free tier limits"
        };
      case "unavailable":
        return {
          icon: <Clock className="h-4 w-4 text-red-500" />,
          color: "bg-red-50 border-red-200 text-red-800",
          label: "Rate Limited",
          message: "Free tier rate limit reached, please wait"
        };
    }
  };

  const statusInfo = getStatusInfo();
  const serviceName = service === "openai" ? "ChatGPT" : "Gemini";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-1">
                  {statusInfo.icon}
                  <span className="text-sm font-medium">{serviceName}</span>
                  {model && (
                    <Badge variant="outline" className="text-xs">
                      {model}
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1 text-xs">
                  <p className="font-medium">{statusInfo.message}</p>
                  {limits && (
                    <>
                      <p>Requests/min: {limits.currentUsage}/{limits.requestsPerMinute}</p>
                      <p>Daily usage: {limits.dailyUsage}/{limits.requestsPerDay}</p>
                      <p>Tokens/min: {limits.tokensPerMinute.toLocaleString()}</p>
                    </>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Badge 
          variant={status === "available" ? "default" : status === "limited" ? "secondary" : "destructive"}
          className="text-xs"
        >
          <Zap className="h-3 w-3 mr-1" />
          Free Tier
        </Badge>
      </div>

      {status !== "available" && (
        <Alert className={`${statusInfo.color} text-xs py-2`}>
          <AlertTriangle className="h-3 w-3" />
          <AlertDescription className="text-xs">
            {status === "limited" ? (
              <>
                <strong>Free tier warning:</strong> You've used {limits?.dailyUsage} of {limits?.requestsPerDay} daily requests. 
                Consider upgrading for unlimited access.
              </>
            ) : (
              <>
                <strong>Rate limit reached:</strong> Free tier allows {limits?.requestsPerMinute} requests per minute. 
                Please wait or upgrade for higher limits.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}