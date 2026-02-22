
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  GitCompareArrows,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  RotateCcw,
  Edit,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Minus,
  Info,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Lightbulb,
  Brain,
  TrendingUp,
  Activity,
  MessageCircle,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SoilTest } from "@/api/entities";
import { UploadFile, InvokeLLM } from "@/api/integrations";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

import { CropProvider, useCrop } from '../context/CropContext';
import { calculateYieldImpact } from '../utils/penaltyRules';
import { CropTarget } from '@/api/entities';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


const STEP_NAMES = {
  UPLOAD: 'upload',
  EXTRACTION: 'extraction',
  REVIEW: 'review',
  WIDGETS: 'widgets',
  INSIGHTS: 'insights'
};

const SOIL_METRICS = [
  { key: 'ph', label: 'pH', unit: '', optimal: { min: 6.0, max: 7.5 } },
  { key: 'organic_matter', label: 'Organic Matter', unit: '%', optimal: { min: 2.0, max: 4.0 } },
  { key: 'nitrogen', label: 'Nitrogen', unit: 'ppm', optimal: { min: 20, max: 50 } },
  { key: 'phosphorus', label: 'Phosphorus', unit: 'ppm', optimal: { min: 30, max: 80 } },
  { key: 'potassium', label: 'Potassium', unit: 'ppm', optimal: { min: 150, max: 300 } },
  { key: 'calcium', label: 'Calcium', unit: 'ppm', optimal: { min: 1000, max: 2000 } },
  { key: 'magnesium', label: 'Magnesium', unit: 'ppm', optimal: { min: 120, max: 300 } },
  { key: 'sulfur', label: 'Sulfur', unit: 'ppm', optimal: { min: 10, max: 20 } },
  { key: 'cec', label: 'CEC', unit: 'meq/100g', optimal: { min: 10, max: 25 } }
];

// Enhanced Widget Components based on research
const SlopeChart = ({ metric, baseline, current, change }) => {
  const data = [
    { period: 'Baseline', value: parseFloat(baseline) },
    { period: 'Current', value: parseFloat(current) }
  ];

  // Determine if change crosses optimal band boundary
  const crossesBoundary = (baseline < metric.optimal.min && current >= metric.optimal.min) ||
                         (baseline > metric.optimal.max && current <= metric.optimal.max) ||
                         (baseline >= metric.optimal.min && baseline <= metric.optimal.max &&
                          (current < metric.optimal.min || current > metric.optimal.max));

  const lineColor = crossesBoundary ? '#DC2626' : '#6B7280'; // Red for story, gray for neutral
  const lineWidth = crossesBoundary ? 3 : 2;

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" strokeWidth={1} />
          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            fontSize={11}
            tick={{ fill: '#6B7280' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            fontSize={11}
            tick={{ fill: '#6B7280' }}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '12px',
              backdropFilter: 'blur(8px)'
            }}
            formatter={(value) => [`${value} ${metric.unit}`, metric.label]}
          />
          {/* Optimal range bands */}
          <ReferenceLine y={metric.optimal.min} stroke="#10B981" strokeDasharray="2 2" strokeOpacity={0.3} />
          <ReferenceLine y={metric.optimal.max} stroke="#10B981" strokeDasharray="2 2" strokeOpacity={0.3} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={lineWidth}
            dot={{ fill: lineColor, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: lineColor }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const DeltaCard = ({ metric, comparison }) => {
  const { baseline, current, change, percentChange } = comparison;

  const getChangeColor = () => {
    if (Math.abs(change) < 0.1) return '#6B7280';
    return change > 0 ? '#10B981' : '#EF4444';
  };

  const getChangeIcon = () => {
    if (Math.abs(change) < 0.1) return <Minus className="w-5 h-5" />;
    return change > 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />;
  };

  const color = getChangeColor();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
      <div className="text-center">
        <div className="text-sm text-gray-600 mb-1">{metric.label}</div>
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {Math.abs(change).toFixed(2)}
          <span className="text-sm font-normal text-gray-500 ml-1">{metric.unit}</span>
        </div>
        <div className="flex items-center justify-center gap-2 mb-2" style={{ color }}>
          {getChangeIcon()}
          <span className="font-semibold">
            {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
          </span>
        </div>
        <Badge
          className="text-xs"
          style={{
            backgroundColor: `${color}20`,
            color: color,
            border: `1px solid ${color}40`
          }}
        >
          {baseline} → {current} {metric.unit}
        </Badge>
      </div>
    </div>
  );
};

const WaterfallChart = ({ comparisons }) => {
  // Create waterfall data showing net nutrient balance
  const waterfallData = comparisons.map(comp => ({
    nutrient: comp.metricInfo.label,
    change: comp.change,
    isPositive: comp.change > 0
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" strokeOpacity={0.5} />
          <XAxis
            dataKey="nutrient"
            axisLine={false}
            tickLine={false}
            fontSize={10}
            angle={-45}
            textAnchor="end"
          />
          <YAxis axisLine={false} tickLine={false} fontSize={11} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backdropFilter: 'blur(8px)'
            }}
          />
          <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
          <Bar dataKey="change" radius={[4, 4, 0, 0]}>
            {waterfallData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isPositive ? '#10B98180' : '#EF444480'}
                stroke={entry.isPositive ? '#10B981' : '#EF4444'}
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const RadarComparison = ({ comparisons }) => {
  // Limit to 6 key nutrients for radar readability
  const keyNutrients = ['ph', 'organic_matter', 'nitrogen', 'phosphorus', 'potassium', 'cec'];
  const radarData = keyNutrients.map(key => {
    const comp = comparisons.find(c => c.metric === key);
    if (!comp) return null;

    // Normalize to 0-100 scale for radar visualization
    const normalizeValue = (value, metric) => {
      const range = metric.optimal.max - metric.optimal.min;
      if (range === 0) return 50; // Avoid division by zero, center for constant metrics
      const normalized = ((value - metric.optimal.min) / range) * 100;
      return Math.min(100, Math.max(0, normalized)); // Clamp to 0-100
    };

    return {
      nutrient: comp.metricInfo.label,
      baseline: normalizeValue(parseFloat(comp.baseline), comp.metricInfo),
      current: normalizeValue(parseFloat(comp.current), comp.metricInfo)
    };
  }).filter(Boolean);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="nutrient" fontSize={11} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Previous"
            dataKey="baseline"
            stroke="#9CA3AF"
            fill="#9CA3AF"
            fillOpacity={0.1}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <Radar
            name="Current"
            dataKey="current"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.15}
            strokeWidth={3}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

const EnhancedComparisonTable = ({ comparisons, changeView, onCellClick }) => {
  const { selectedCrop, setSelectedCrop, targetsDict } = useCrop();

  const getStatusBadge = (current, metricKey) => {
    const target = targetsDict[metricKey];
    if (!target) return { color: 'bg-gray-100 text-gray-800', text: '—' };

    const value = parseFloat(current);
    if (isNaN(value)) return { color: 'bg-gray-100 text-gray-800', text: 'N/A' };


    if (value < target.min) {
      return { color: 'bg-red-100 text-red-800 border-red-200', text: 'Low' };
    } else if (value <= target.max) {
      return { color: 'bg-green-100 text-green-800 border-green-200', text: 'Optimal' };
    } else {
      return { color: 'bg-orange-100 text-orange-800 border-orange-200', text: 'High' };
    }
  };

  const crops = ['corn', 'soybean', 'wheat', 'cotton', 'rice'];

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-sm border-muted ring-1 rounded-xl">
      <CardHeader className="pb-4 border-b bg-background/50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800">Numerical Summary</CardTitle>
          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {crops.map(crop => (
                <SelectItem key={crop} value={crop}>
                  {crop.charAt(0).toUpperCase() + crop.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-gray-600">
          Click on changed values to ask Tilly about them
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[calc(100vh-260px)] overflow-y-auto pb-6">
          <Table>
            <TableHeader className="sticky top-0 bg-background shadow-sm">
              <TableRow>
                <TableHead className="w-[25%] font-semibold text-gray-600">Metric</TableHead>
                <TableHead className="w-[15%] text-right font-semibold text-gray-600">Baseline</TableHead>
                <TableHead className="w-[15%] text-right font-semibold text-gray-600">Current</TableHead>
                <TableHead className="w-[15%] text-right font-semibold text-gray-600">
                  {changeView === 'absolute' ? 'Change' : '% Change'}
                </TableHead>
                <TableHead className="w-[20%] text-center font-semibold text-gray-600">Target Range</TableHead>
                <TableHead className="w-[10%] text-center font-semibold text-gray-600">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisons.map((comp, index) => {
                const target = targetsDict[comp.metric];
                const status = getStatusBadge(comp.current, comp.metric);
                const hasSignificantChange = Math.abs(comp.percentChange) > 5;

                return (
                  <TableRow key={comp.metric} className={index % 2 === 0 ? 'bg-white/30' : ''}>
                    <TableCell className="font-medium text-gray-800">
                      {comp.metricInfo.label}
                    </TableCell>
                    <TableCell className="text-right text-gray-700 tabular-nums">
                      {parseFloat(comp.baseline).toFixed(2)} {comp.metricInfo.unit}
                    </TableCell>
                    <TableCell className="text-right text-gray-700 tabular-nums">
                      {typeof comp.current === 'number' ? comp.current.toFixed(2) : parseFloat(comp.current).toFixed(2)} {comp.metricInfo.unit}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold tabular-nums ${
                        comp.percentChange > 0 ? 'text-green-600' :
                        comp.percentChange < 0 ? 'text-red-600' : 'text-gray-500'
                      } ${hasSignificantChange ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                      onClick={() => hasSignificantChange && onCellClick(comp)}
                      title={hasSignificantChange ? `Click to ask Tilly about ${comp.metricInfo.label} changes` : ''}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {comp.change > 0 ? <ArrowUp className="w-3 h-3" /> :
                         comp.change < 0 ? <ArrowDown className="w-3 h-3" /> :
                         <Minus className="w-3 h-3" />}
                        {changeView === 'absolute'
                          ? `${comp.change > 0 ? '+' : ''}${comp.change.toFixed(2)} ${comp.metricInfo.unit}`
                          : `${comp.percentChange > 0 ? '+' : ''}${comp.percentChange.toFixed(1)}%`
                        }
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600">
                      {target ? `${target.min}–${target.max} ${target.units}` : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${status.color} border text-xs font-medium`}>
                        {status.text}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

const YieldImpactEstimator = ({ comparisons, crop, targetsDict }) => {
  const yieldImpact = calculateYieldImpact(comparisons, targetsDict, crop);

  const getImpactColor = (impact) => {
    if (impact === 0) return 'bg-green-100 text-green-800 border-green-200';
    if (impact <= 10) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (impact <= 25) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-sm border-muted ring-1 rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-800">Estimated Yield Impact for {crop.charAt(0).toUpperCase() + crop.slice(1)}</h4>
            <p className="text-sm text-gray-600">{yieldImpact.message}</p>
          </div>
          <Badge className={`${getImpactColor(yieldImpact.impact)} border font-bold text-lg px-3 py-1`}>
            {yieldImpact.impact.toFixed(0)}%
          </Badge>
        </div>
        {yieldImpact.factors && yieldImpact.factors.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Contributing factors:</p>
            <div className="flex flex-wrap gap-2">
              {yieldImpact.factors.map((factor, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {factor.metric}: -{factor.penalty.toFixed(1)}%
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Updated TillyChatArea with enhanced prompts
const TillyChatArea = ({ comparisons, dataset1, dataset2, onCellClickPrompt, crop, targetsDict }) => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // No longer generating initial recommendation automatically
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate context from comparison data
  const generateComparisonContext = () => {
    const contextLines = [
      `Comparison Context: ${dataset1.data?.field_name || 'Baseline Test'} (Test Date: ${dataset1.data?.test_date ? format(new Date(dataset1.data.test_date), 'yyyy-MM-dd') : 'N/A'}) vs ${dataset2.data?.field_name || 'Current Test'} (Test Date: ${dataset2.data?.test_date ? format(new Date(dataset2.data.test_date), 'yyyy-MM-dd') : 'N/A'})`,
      '',
      'Key Changes:'
    ];

    comparisons.forEach(comp => {
      const direction = comp.change > 0 ? 'increased' : comp.change < 0 ? 'decreased' : 'remained stable';
      const changeDesc = Math.abs(comp.percentChange) > 0.1
        ? `${direction} by ${Math.abs(comp.change).toFixed(2)} ${comp.metricInfo.unit} (${Math.abs(comp.percentChange).toFixed(1)}%)`
        : 'remained stable';
      contextLines.push(`- ${comp.metricInfo.label} (${parseFloat(comp.baseline).toFixed(2)} -> ${typeof comp.current === 'number' ? comp.current.toFixed(2) : parseFloat(comp.current).toFixed(2)} ${comp.metricInfo.unit}): ${changeDesc}`);
    });

    return contextLines.join('\n');
  };

  const generateEnhancedPrompt = (comparison) => {
    const target = targetsDict[comparison.metric];
    const currentVal = typeof comparison.current === 'number' ? comparison.current : parseFloat(comparison.current);
    const units = comparison.metricInfo.unit;

    let prompt = `Current ${comparison.metricInfo.label} is ${currentVal.toFixed(2)} ${units}.`;

    if (target) {
      prompt += ` Optimal range for ${crop} is ${target.min}–${target.max} ${target.units}.`;

      if (currentVal < target.min) {
        prompt += ` This is below optimal. What are the implications for ${crop} and how can I improve it?`;
      } else if (currentVal > target.max) {
        prompt += ` This is above optimal. What issues might this cause for ${crop} and how should I manage it?`;
      } else {
        prompt += ` This is within the optimal range for ${crop}. Are there any fine-tuning recommendations or potential future concerns?`;
      }
    } else {
      prompt += ` What does this level mean for ${crop} production and soil health?`;
    }

    return prompt;
  };

  const askTilly = async (question) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const context = generateComparisonContext();
      const chatHistory = messages.map(msg => `${msg.type === 'user' ? 'User' : 'Tilly'}: ${msg.content}`).join('\n');

      const prompt = `
You are Tilly, an expert agronomist. Your goal is to provide practical, science-based advice related to soil health and crop management for ${crop}.

Soil Test Comparison Data:
${context}

Current Conversation History:
${chatHistory}

User's Specific Question: ${question}

Answer the user's question. Explain what this specific data point means for soil health and crop production, especially for ${crop}. Provide 2-3 actionable management recommendations. Be concise but comprehensive.
      `;

      const response = await InvokeLLM({
        prompt: prompt,
      });

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        content: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error asking Tilly:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm having trouble processing that question right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    }
    setIsLoading(false);
  }

  // Handle cell click prompts
  useEffect(() => {
    if (onCellClickPrompt) {
      handleCellClickQuestion(onCellClickPrompt);
    }
  }, [onCellClickPrompt]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCellClickQuestion = async (comparison) => {
    const enhancedPrompt = generateEnhancedPrompt(comparison);
    await askTilly(enhancedPrompt);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    await askTilly(currentMessage);
    setCurrentMessage(''); // Clear input after sending
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50 h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-gray-200/50 flex-shrink-0">
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-600" />
          Ask Tilly About Changes
        </CardTitle>
        <p className="text-sm text-gray-600">Click table cells or ask questions directly</p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Messages Area - Fixed Height with Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '400px', minHeight: '200px' }}>
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Click on changed values in the table</p>
              <p className="text-xs text-gray-400">or ask Tilly a question below</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-emerald-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] p-3 rounded-lg bg-gray-100">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-600">Tilly is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Fixed at Bottom */}
        <div className="border-t border-gray-200/50 p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask Tilly about these soil changes..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1 min-h-[40px] max-h-[100px] resize-none"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isLoading}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Widget Component
const MetricWidget = ({ metric, comparison, insights }) => {
  const { baseline, current, change, percentChange } = comparison;
  const hasData = baseline !== null && current !== null;

  if (!hasData) return null;

  return (
    <Card className="border border-gray-200 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-800 flex items-center justify-between">
          {metric.label}
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${
            Math.abs(change) < 0.1 ? 'bg-gray-100 text-gray-600' :
            change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {change > 0 ? '+' : ''}{change.toFixed(2)} {metric.unit}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SlopeChart
          metric={metric}
          baseline={baseline}
          current={current}
          change={change}
        />

        {insights && (
          <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200/50">
            <p className="text-xs text-blue-800">{insights}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main component with CropProvider wrapper
const WhatChangedWidgetContent = ({ isSelected, onSelect, onClose }) => {
  const [currentStep, setCurrentStep] = useState(STEP_NAMES.UPLOAD);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Data states
  const [dataset1, setDataset1] = useState({ file: null, data: null, source: 'upload' });
  const [dataset2, setDataset2] = useState({ file: null, data: null, source: 'upload' });
  const [existingSoilTests, setExistingSoilTests] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [tillyInsights, setTillyInsights] = useState(null); // Preserved for download
  const [editingDataset, setEditingDataset] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [changeView, setChangeView] = useState('absolute'); // State for toggle
  const [cellClickPrompt, setCellClickPrompt] = useState(null);

  const { selectedCrop, targetsDict } = useCrop();

  const fileInput1Ref = useRef(null);
  const fileInput2Ref = useRef(null);

  // New states introduced by the outline
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(null);
  const [comparisonResult, setComparisonResult] = useState('');
  const [tillyResponse, setTillyResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null); // Assuming this stores the textual analysis
  const [isTillyLoading, setIsTillyLoading] = useState(false);
  const [tillyError, setTillyError] = useState(null);
  const [tillyQuestion, setTillyQuestion] = useState(''); // Input for the new Tilly interaction

  // New functions introduced by the outline
  const extractDataFromTests = async (testData) => {
    setIsExtracting(true);
    setExtractionError(null);
    setComparisonResult('');
    setTillyResponse('');
    setConversationHistory([]);

    try {
        const prompt = `
You are a soil test analysis expert. Compare these two soil test results and extract the numerical differences.

Soil Test Data to Analyze:
${testData}

Provide a clear comparison showing:
1. What tests are being compared (field names and dates)
2. For each nutrient that has values in both tests, show:
   - Nutrient name
   - Old value -> New value
   - The numerical change
   - Percentage change if significant

Focus on nutrients with actual numerical values. Ignore null or missing values.

Format your response as a clear text analysis, not JSON.
        `;

        const response = await InvokeLLM({
            prompt: prompt
        });

        if (!response || typeof response !== 'string') {
            throw new Error('No response received from extraction service');
        }

        // For now, just display the AI's text analysis directly
        setComparisonResult(response);

        // Create a simple analysis object for Tilly conversations
        setCurrentAnalysis({
            comparison_context: response.substring(0, 200) + "...",
            key_changes: [],
            summary: response
        });

    } catch (error) {
        console.error('Extraction failed:', error);
        setExtractionError(`Extraction failed: ${error.message}`);
    } finally {
        setIsExtracting(false);
    }
  };

  const askTillyAboutComparison = async (userQuestion) => {
      if (!currentAnalysis || !userQuestion.trim()) {
          setTillyError("Please provide a question and ensure you have comparison data.");
          return;
      }

      setIsTillyLoading(true);
      setTillyError(null);

      try {
          // Build conversation context
          const conversationContext = conversationHistory.length > 0
              ? conversationHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Tilly'}: ${msg.content}`).join('\n')
              : '';

          const prompt = `
You are Tilly, an expert agronomist. Your goal is to provide practical, science-based advice related to soil health and crop management.

Soil Test Comparison Data:
${comparisonResult}

Current Conversation History:
${conversationContext}

User's Specific Question: ${userQuestion}

Answer the user's question. Explain what this specific data point means for soil health and crop production. Provide 2-3 actionable management recommendations. Be concise but comprehensive.
          `;

          const response = await InvokeLLM({
              prompt: prompt
          });

          if (!response || typeof response !== 'string') {
              throw new Error('No response received from Tilly');
          }

          // Add to conversation history
          const newHistory = [
              ...conversationHistory,
              { role: 'user', content: userQuestion },
              { role: 'assistant', content: response }
          ];
          setConversationHistory(newHistory);
          setTillyResponse(response);
          setTillyQuestion(''); // Clear the input

      } catch (error) {
          console.error('Error asking Tilly:', error);
          setTillyError(`Error asking Tilly: ${error.message}`);
      } finally {
          setIsTillyLoading(false);
      }
  };


  useEffect(() => {
    if (isSelected) {
      loadExistingSoilTests();
      setCurrentStep(STEP_NAMES.UPLOAD);
    }
  }, [isSelected]);

  const loadExistingSoilTests = async () => {
    try {
      const tests = await SoilTest.list('-test_date');
      setExistingSoilTests(tests);
    } catch (error) {
      console.error('Error loading soil tests:', error);
    }
  };

  const handleCollapse = () => {
    setError(null);
    setIsProcessing(false);
    setProcessingMessage('');
    setDataset1({ file: null, data: null, source: 'existing' }); // Changed default source to 'existing'
    setDataset2({ file: null, data: null, source: 'existing' }); // Changed default source to 'existing'
    setComparisonResults(null);
    setTillyInsights(null);
    setEditingDataset(null);
    setFeedback(null);
    setCurrentStep(STEP_NAMES.UPLOAD);
    // Reset new states as well
    setIsExtracting(false);
    setExtractionError(null);
    setComparisonResult('');
    setTillyResponse('');
    setConversationHistory([]);
    setCurrentAnalysis(null);
    setIsTillyLoading(false);
    setTillyError(null);
    setTillyQuestion('');

    onClose();
  };

  const handleFileUpload = (datasetNumber, file) => {
    // This function should ideally not be reachable if 'upload' is removed as an option from select
    // However, keeping it for robustness or if direct file input is still available but hidden.
    const setDataset = datasetNumber === 1 ? setDataset1 : setDataset2;
    setDataset(prev => ({ ...prev, file, data: null, source: 'upload' })); // Ensure source is 'upload' if a file is actually uploaded
    setError(null);
  };

  const handleExistingTestSelect = (datasetNumber, testId) => {
    const test = existingSoilTests.find(t => t.id === testId);
    if (!test) return;

    const setDataset = datasetNumber === 1 ? setDataset1 : setDataset2;
    setDataset(prev => ({
      ...prev,
      file: null,
      data: {
        id: test.id, // Add ID for better tracking of selected existing test
        field_name: test.field_name,
        test_date: test.test_date,
        ...test.soil_data
      },
      source: 'existing' // Explicitly set source to 'existing'
    }));
    setError(null);
  };

  const extractDataFromFile = async (file) => {
    // This function will only be called if a file *was* uploaded despite the UI emphasis on 'existing'
    setProcessingMessage(`Extracting data from ${file.name}...`);

    try {
      const { file_url } = await UploadFile({ file });

      setProcessingMessage('Using AI extraction for soil data...');

      const extractionPrompt = `
        You are an expert soil data analyst. Extract key soil test data from the provided document.
        The metrics I need are: pH, organic_matter, nitrogen, phosphorus, potassium, calcium, magnesium, sulfur, and cec.
        Also extract the test_date and field_name if available.

        IMPORTANT: Respond ONLY with a valid JSON object. Do not include any text, explanations, or markdown formatting like \`\`\`json. Your entire response should be the JSON object itself.
        For any metric that is not found or is unclear, use a value of -1.

        The JSON structure must be:
        {
          "field_name": "string",
          "test_date": "YYYY-MM-DD",
          "ph": number,
          "organic_matter": number,
          "nitrogen": number,
          "phosphorus": number,
          "potassium": number,
          "calcium": number,
          "magnesium": number,
          "sulfur": number,
          "cec": number
        }
      `;

      const rawResult = await InvokeLLM({
        prompt: extractionPrompt,
        file_urls: [file_url],
      });

      // Clean up the response to handle markdown formatting and extract JSON
      let cleanedResponse = rawResult.trim();

      // Attempt to extract only the JSON part if the LLM added extra text or markdown
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
          cleanedResponse = jsonMatch[0];
      } else {
          // If no JSON object is found, it's a critical error for structured data
          throw new Error("No valid JSON object found in the AI response. Response: " + cleanedResponse.substring(0, 200) + "...");
      }

      let parsedResult;
      try {
          parsedResult = JSON.parse(cleanedResponse);
      } catch (parseError) {
          console.error('JSON parsing failed after cleaning:', parseError);
          throw new Error(`The AI returned malformed data that could not be parsed into JSON. Details: ${parseError.message}`);
      }

      // Convert -1 values to null for consistency
      const finalResult = { ...parsedResult };
      Object.keys(finalResult).forEach(key => {
        if (finalResult[key] === -1) {
          finalResult[key] = null;
        }
      });

      // Ensure all SOIL_METRICS keys are present, even if null, for consistent structure downstream
      SOIL_METRICS.forEach(metric => {
        if (finalResult[metric.key] === undefined) {
          finalResult[metric.key] = null;
        }
      });

      return finalResult;
    } catch (error) {
      throw new Error(`Extraction failed: ${error.message}`);
    }
  };

  const handleDataExtraction = async () => {
    // Validate that existing tests are selected or files are uploaded
    if (!dataset1.data && !dataset1.file) {
      setError('Please select a Baseline Test from My Records.');
      return;
    }
    if (!dataset2.data && !dataset2.file) {
      setError('Please select a Current Test from My Records.');
      return;
    }

    setIsProcessing(true);
    setCurrentStep(STEP_NAMES.EXTRACTION);
    setError(null);

    try {
      // If dataset1 has a file but no data (meaning it was a new upload), extract it
      if (dataset1.file && !dataset1.data) {
        const data1 = await extractDataFromFile(dataset1.file);
        setDataset1(prev => ({ ...prev, data: data1 }));
      }

      // If dataset2 has a file but no data (meaning it was a new upload), extract it
      if (dataset2.file && !dataset2.data) {
        const data2 = await extractDataFromFile(dataset2.file);
        setDataset2(prev => ({ ...prev, data: data2 }));
      }

      setProcessingMessage('Data extraction complete!');
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentStep(STEP_NAMES.REVIEW);
    } catch (error) {
      setError(error.message);
      setCurrentStep(STEP_NAMES.UPLOAD);
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const handleProceed = async () => {
    if (!dataset1.data || !dataset2.data) {
      setError('Both datasets must have valid data to proceed.');
      return;
    }

    setIsProcessing(true);
    setCurrentStep(STEP_NAMES.WIDGETS);
    setProcessingMessage('Computing deltas and generating widgets...');

    try {
      const data1 = dataset1.data;
      const data2 = dataset2.data;

      // Compute comparisons with null handling
      const comparisons = SOIL_METRICS.map(metric => {
        const val1 = data1[metric.key];
        const val2 = data2[metric.key];

        // Only include metrics where both values are valid numbers
        if (typeof val1 !== 'number' || val1 === null || typeof val2 !== 'number' || val2 === null) {
          return null;
        }

        const change = val2 - val1;
        // Ensure baseline is not 0 for percentChange calculation to avoid Infinity/NaN
        const percentChange = val1 !== 0 ? (change / val1) * 100 : 0;

        return {
          metric: metric.key,
          metricInfo: metric,
          baseline: val1, // Store as number
          current: val2, // Store as number
          change: change,
          percentChange: percentChange
        };
      }).filter(Boolean); // Remove null entries

      setComparisonResults({
        comparisons,
        hasData: comparisons.length > 0
      });


      // Generate Tilly insights for download report (kept as per original functionality)
      const coreMetrics = ['ph', 'organic_matter', 'nitrogen', 'phosphorus', 'potassium'];
      const hasCoreMetrics = comparisons.some(comp => coreMetrics.includes(comp.metric));

      if (hasCoreMetrics) {
        await generateTillyInsights(comparisons);
      }

      setCurrentStep(STEP_NAMES.INSIGHTS);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const generateTillyInsights = async (comparisons) => {
    try {
      const deltaData = comparisons.map(comp => ({
        nutrient: comp.metricInfo.label,
        change: comp.change,
        percentChange: comp.percentChange,
        unit: comp.metricInfo.unit
      }));

      const tillyPrompt = `
        As an expert agronomist, analyze these soil nutrient changes:

        ${JSON.stringify(deltaData, null, 2)}

        Provide exactly 3 specific, actionable management recommendations based on these changes.
        Format your response as a simple text list, with each recommendation on a new line, starting with a dash.
        For example:
        - Recommendation 1...
        - Recommendation 2...
        - Recommendation 3...
      `;

      const rawResponse = await InvokeLLM({
        prompt: tillyPrompt,
      });

      // Split the text response into an array of recommendations
      // Filter out empty lines and ensure they start with a dash
      const recommendations = rawResponse.split('\n')
                                      .map(line => line.trim())
                                      .filter(line => line.startsWith('-') && line.length > 1);

      setTillyInsights(recommendations || []);
    } catch (error) {
      console.error('Error generating Tilly insights for report:', error);
      setTillyInsights(null);
    }
  };

  const downloadReport = () => {
    if (!comparisonResults) return;

    const reportContent = `
SOIL TEST COMPARISON REPORT
===========================

Dataset 1: ${dataset1.data?.field_name || 'Baseline'} (${dataset1.data?.test_date ? format(new Date(dataset1.data.test_date), 'yyyy-MM-dd') : 'Date not specified'})
Dataset 2: ${dataset2.data?.field_name || 'Current'} (${dataset2.data?.test_date ? format(new Date(dataset2.data.test_date), 'yyyy-MM-dd') : 'N/A'})

COMPARISON RESULTS
==================
${comparisonResults.comparisons.map(comp =>
  `${comp.metricInfo.label}: ${parseFloat(comp.baseline).toFixed(2)} \u2192 ${typeof comp.current === 'number' ? comp.current.toFixed(2) : parseFloat(comp.current).toFixed(2)} ${comp.metricInfo.unit} (${comp.change > 0 ? '+' : ''}${comp.change.toFixed(2)}, ${comp.percentChange.toFixed(1)}%)`
).join('\n')}

MANAGEMENT RECOMMENDATIONS
==========================
${tillyInsights && tillyInsights.length > 0 ? tillyInsights.map((rec, i) => `${i + 1}. ${rec.substring(1).trim()}`).join('\n') : 'No specific recommendations generated for download.'}

Generated by SoilOS - What\'s Changed Tool
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `soil-comparison-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const EditDataModal = ({ dataset, onSave, onClose }) => {
    const [editedData, setEditedData] = useState({ ...dataset });

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        >
          <div className="p-6 border-b">
            <h3 className="text-lg font-bold text-gray-900">Edit Dataset</h3>
            <p className="text-gray-600">Review and correct the extracted data. Leave blank if not available.</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Field Name</Label>
                <Input
                  value={editedData.field_name || ''}
                  onChange={(e) => setEditedData({...editedData, field_name: e.target.value})}
                />
              </div>
              <div>
                <Label>Test Date</Label>
                <Input
                  type="date"
                  value={editedData.test_date || ''}
                  onChange={(e) => setEditedData({...editedData, test_date: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {SOIL_METRICS.map(metric => (
                <div key={metric.key}>
                  <Label className="capitalize">{metric.label} ({metric.unit})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editedData[metric.key] === null ? '' : editedData[metric.key]}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      [metric.key]: e.target.value === '' ? null : parseFloat(e.target.value)
                    })}
                    placeholder="Leave blank if not available"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={() => onSave(editedData)}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const handleCellClick = (comparison) => {
    // Pass a copy of the comparison object to ensure useEffect re-triggers if same object is re-clicked
    setCellClickPrompt({ ...comparison });
    // Reset after a short delay to ensure the effect in TillyChatArea triggers reliably for each distinct click
    setTimeout(() => setCellClickPrompt(null), 100);
  };

  const renderStep = () => {
    switch (currentStep) {
      case STEP_NAMES.UPLOAD:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Compare Your Soil Test Records</h3>
              <p className="text-gray-600">
                Now works with your saved soil tests. Pick any two from My Records to see what's changed.
                Need to add a new test? Use the Upload page.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Dataset 1 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Baseline Dataset</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Select for Existing Tests */}
                  <div className="space-y-3">
                    <Label>Select Baseline Soil Test</Label>
                    <Select onValueChange={(value) => handleExistingTestSelect(1, value)} value={dataset1.data?.id || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a soil test" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingSoilTests.length === 0 ? (
                          <SelectItem value="no-tests" disabled>No saved tests available</SelectItem>
                        ) : (
                          existingSoilTests.map(test => (
                            <SelectItem key={test.id} value={test.id}>
                              {test.field_name} ({format(new Date(test.test_date), 'PPP')})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Removed direct file upload option, redirecting to Upload page for new tests */}
                  {dataset1.data && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 inline mr-2" />
                      <span className="text-blue-800 font-medium">Dataset 1 Ready: {dataset1.data.field_name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dataset 2 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Dataset</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Select for Existing Tests */}
                  <div className="space-y-3">
                    <Label>Select Current Soil Test</Label>
                    <Select onValueChange={(value) => handleExistingTestSelect(2, value)} value={dataset2.data?.id || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a soil test" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingSoilTests.length === 0 ? (
                          <SelectItem value="no-tests" disabled>No saved tests available</SelectItem>
                        ) : (
                          existingSoilTests.map(test => (
                            <SelectItem key={test.id} value={test.id}>
                              {test.field_name} ({format(new Date(test.test_date), 'PPP')})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Removed direct file upload option, redirecting to Upload page for new tests */}
                  {dataset2.data && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600 inline mr-2" />
                      <span className="text-green-800 font-medium">Dataset 2 Ready: {dataset2.data.field_name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleDataExtraction}
                disabled={!dataset1.data || !dataset2.data} // Only enable if both existing tests are selected
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Compare Selected Tests
                <ArrowUp className="w-4 h-4 ml-2 rotate-45" />
              </Button>
            </div>
          </div>
        );

      case STEP_NAMES.EXTRACTION:
        return (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center"
            >
              <GitCompareArrows className="w-8 h-8 text-emerald-600" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Your Data</h3>
            <p className="text-gray-600 mb-4">{processingMessage}</p>
            <Progress value={66} className="w-64 mx-auto" />
          </div>
        );

      case STEP_NAMES.REVIEW:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Review Extracted Data</h3>
              <p className="text-gray-600">Verify the data before generating comparison. Empty cells indicate data not found.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Baseline Dataset</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDataset({ number: 1, data: dataset1.data })}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Field:</strong> {dataset1.data?.field_name || 'Not specified'}</p>
                    <p><strong>Date:</strong> {dataset1.data?.test_date ? format(new Date(dataset1.data.test_date), 'yyyy-MM-dd') : 'Not specified'}</p>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {SOIL_METRICS.map(metric => (
                        <div key={metric.key} className="text-sm">
                          <span className="font-medium">{metric.label}:</span>
                          <span className="text-gray-700 ml-1">
                            {dataset1.data?.[metric.key] !== undefined && dataset1.data?.[metric.key] !== null ?
                              `${dataset1.data[metric.key]} ${metric.unit}` :
                              'Not found'
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Current Dataset</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDataset({ number: 2, data: dataset2.data })}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Field:</strong> {dataset2.data?.field_name || 'Not specified'}</p>
                    <p><strong>Date:</strong> {dataset2.data?.test_date ? format(new Date(dataset2.data.test_date), 'yyyy-MM-dd') : 'Not specified'}</p>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {SOIL_METRICS.map(metric => (
                        <div key={metric.key} className="text-sm">
                          <span className="font-medium">{metric.label}:</span>
                          <span className="text-gray-700 ml-1">
                            {dataset2.data?.[metric.key] !== undefined && dataset2.data?.[metric.key] !== null ?
                              `${dataset2.data[metric.key]} ${metric.unit}` :
                              'Not found'
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(STEP_NAMES.UPLOAD)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Back to Selection
              </Button>
              <Button onClick={handleProceed} className="bg-emerald-600 hover:bg-emerald-700">
                Proceed with Available Data
                <GitCompareArrows className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case STEP_NAMES.WIDGETS:
        return (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center"
            >
              <BarChart3 className="w-8 h-8 text-emerald-600" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Generating Research-Based Visualizations</h3>
            <p className="text-gray-600 mb-4">{processingMessage}</p>
            <Progress value={80} className="w-64 mx-auto" />
          </div>
        );

      case STEP_NAMES.INSIGHTS:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">What Changed?</h3>
              <p className="text-gray-600">
                {dataset1.data?.field_name || 'Baseline'} vs {dataset2.data?.field_name || 'Current'}
              </p>
            </div>

            {!comparisonResults?.hasData ? (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-600" />
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">No Comparable Data Found</h3>
                  <p className="text-amber-700">
                    The datasets don't have overlapping metrics to compare. Please check your data and try again.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Enhanced Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-4">
                  {/* Left Side: Enhanced Table */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="inline-flex rounded-md shadow-sm bg-white/80 p-1 border">
                        <Button
                          variant={changeView === 'absolute' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setChangeView('absolute')}
                          className="rounded-md text-xs min-w-[80px]"
                        >
                          Absolute
                        </Button>
                        <Button
                          variant={changeView === 'percentage' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setChangeView('percentage')}
                          className="rounded-md text-xs min-w-[80px]"
                        >
                          Percentage
                        </Button>
                      </div>
                    </div>

                    <EnhancedComparisonTable
                      comparisons={comparisonResults.comparisons}
                      changeView={changeView}
                      onCellClick={handleCellClick}
                    />

                    {/* YieldImpactEstimator is removed as simulate mode is removed */}
                  </div>

                  {/* Right Side: Enhanced Tilly Chat */}
                  <TillyChatArea
                    comparisons={comparisonResults.comparisons}
                    dataset1={dataset1}
                    dataset2={dataset2}
                    onCellClickPrompt={cellClickPrompt}
                    crop={selectedCrop}
                    targetsDict={targetsDict}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                  <Button onClick={downloadReport} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                  <Button onClick={() => {
                    setCurrentStep(STEP_NAMES.UPLOAD);
                    // Reset all states when starting new comparison
                    setComparisonResults(null);
                    setTillyInsights(null);
                    setDataset1({ file: null, data: null, source: 'existing' }); // Changed default source to 'existing'
                    setDataset2({ file: null, data: null, source: 'existing' }); // Changed default source to 'existing'
                    setFeedback(null);
                    setError(null);
                    setProcessingMessage('');
                    setIsProcessing(false);
                  }} variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Comparison
                  </Button>
                  <Button onClick={handleCollapse} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Close Tool
                  </Button>
                </div>

                {/* Feedback */}
                <Card className="bg-gray-50/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-gray-700 mb-4">Was this comparison helpful?</p>
                      <div className="flex justify-center gap-3">
                        <Button
                          variant={feedback === 'yes' ? 'default' : 'outline'}
                          onClick={() => setFeedback('yes')}
                          className={feedback === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Yes
                        </Button>
                        <Button
                          variant={feedback === 'no' ? 'default' : 'outline'}
                          onClick={() => setFeedback('no')}
                          className={feedback === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                          <ThumbsDown className="w-4 h-4 mr-2" />
                          No
                        </Button>
                      </div>
                      {feedback && (
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-green-600 mt-2"
                        >
                          Thank you for your feedback!
                        </motion.p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isSelected) {
    return (
      <Card
        className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border-2 border-transparent hover:border-emerald-200 group focus-within:shadow-xl flex flex-col"
        onClick={onSelect}
        tabIndex="0"
      >
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-lg">
            <GitCompareArrows className="w-6 h-6 text-emerald-700" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-gray-800">'What Changed?' Comparison</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden transition-all duration-300 ease-in-out max-h-0 group-hover:max-h-40 group-focus-within:max-h-40 p-0 group-hover:px-6 group-hover:pb-4 group-focus-within:px-6 group-focus-within:pb-4">
          <p className="text-gray-600 pt-2 border-t border-gray-100">
            Compare two of your saved soil tests to see what has improved or declined.
          </p>
        </CardContent>
        <div className="px-6 pb-6 mt-auto">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onSelect}>
            Launch Tool
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="w-full max-w-7xl"
    >
      <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-emerald-200">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitCompareArrows className="w-6 h-6 text-emerald-600" />
              <div>
                <CardTitle className="text-xl font-bold text-emerald-900">'What Changed?' Comparison Tool</CardTitle>
                <p className="text-emerald-700 text-sm">Research-based visualizations with AI insights</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleCollapse} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingDataset && (
          <EditDataModal
            dataset={editingDataset.data}
            onSave={(newData) => {
              if (editingDataset.number === 1) {
                setDataset1(prev => ({ ...prev, data: newData }));
              } else {
                setDataset2(prev => ({ ...prev, data: newData }));
              }
              setEditingDataset(null);
            }}
            onClose={() => setEditingDataset(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function WhatChangedWidget({ isSelected, onSelect, onClose }) {
  return (
    <CropProvider>
      <WhatChangedWidgetContent
        isSelected={isSelected}
        onSelect={onSelect}
        onClose={onClose}
      />
    </CropProvider>
  );
}
