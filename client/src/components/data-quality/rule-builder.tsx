import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Eye, Play, Copy } from "lucide-react";
import { ErrorDisplay, LoadingSkeleton } from "@/components/ui/error-display";

// Rule template definitions
const RULE_TEMPLATES = {
  'custom': {
    name: 'Custom Rule',
    description: 'Create your own validation rule with custom SQL expression',
    category: 'custom',
    difficulty: 'advanced',
    template: '',
    parameters: [],
    examples: ['field > 0', 'LENGTH(field) BETWEEN 5 AND 50', 'field IN (\'A\', \'B\', \'C\')']
  },
  'non-null': {
    name: 'Non-Null Check',
    description: 'Ensures field values are not null or empty',
    category: 'completeness',
    difficulty: 'beginner',
    template: 'field IS NOT NULL AND field != \'\'',
    parameters: [],
    examples: ['customer_id IS NOT NULL', 'email IS NOT NULL AND email != \'\'']
  },
  'email-format': {
    name: 'Email Format Validation',
    description: 'Validates email address format using regex pattern',
    category: 'validity',
    difficulty: 'intermediate',
    template: 'field ~ \'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$\'',
    parameters: [],
    examples: ['email ~ \'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$\'']
  },
  'value-range': {
    name: 'Value Range Check',
    description: 'Validates numeric values fall within specified range',
    category: 'accuracy',
    difficulty: 'beginner',
    template: 'field BETWEEN {min_value} AND {max_value}',
    parameters: ['min_value', 'max_value'],
    examples: ['age BETWEEN 0 AND 120', 'price BETWEEN 0.01 AND 999999.99']
  },
  'regex-pattern': {
    name: 'Custom Regex Pattern',
    description: 'Validates field against custom regular expression',
    category: 'validity',
    difficulty: 'advanced',
    template: 'field ~ \'{pattern}\'',
    parameters: ['pattern'],
    examples: ['phone ~ \'^\\+?1?[0-9]{10,15}$\'', 'postal_code ~ \'^[0-9]{5}(-[0-9]{4})?$\'']
  },
  'string-length': {
    name: 'String Length Validation',
    description: 'Ensures string fields meet length requirements',
    category: 'validity',
    difficulty: 'beginner',
    template: 'LENGTH(field) BETWEEN {min_length} AND {max_length}',
    parameters: ['min_length', 'max_length'],
    examples: ['LENGTH(name) BETWEEN 2 AND 100', 'LENGTH(description) <= 500']
  },
  'date-range': {
    name: 'Date Range Validation',
    description: 'Validates dates fall within acceptable range',
    category: 'accuracy',
    difficulty: 'intermediate',
    template: 'field BETWEEN \'{start_date}\' AND \'{end_date}\'',
    parameters: ['start_date', 'end_date'],
    examples: ['created_at >= \'2020-01-01\'', 'birth_date BETWEEN \'1900-01-01\' AND CURRENT_DATE']
  },
  'unique-values': {
    name: 'Uniqueness Check',
    description: 'Ensures field values are unique within the table',
    category: 'uniqueness',
    difficulty: 'intermediate',
    template: 'field IN (SELECT field FROM table_name GROUP BY field HAVING COUNT(*) = 1)',
    parameters: ['table_name'],
    examples: ['email IN (SELECT email FROM users GROUP BY email HAVING COUNT(*) = 1)']
  }
};

interface RuleBuilderProps {
  tableId?: number;
  fieldName?: string;
  onSave: (rule: any) => void;
  onCancel: () => void;
}

export function RuleBuilder({ tableId, fieldName, onSave, onCancel }: RuleBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [ruleName, setRuleName] = useState('');
  const [ruleExpression, setRuleExpression] = useState('');
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [isTestMode, setIsTestMode] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [sampleData, setSampleData] = useState<any[]>([]);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [isTestingRule, setIsTestingRule] = useState(false);

  const handleTemplateSelect = (templateKey: string) => {
    const template = RULE_TEMPLATES[templateKey as keyof typeof RULE_TEMPLATES];
    if (!template) return;

    setSelectedTemplate(templateKey);
    setRuleName(template.name);
    setRuleExpression(template.template);
    
    // Initialize parameters
    const newParams: Record<string, string> = {};
    template.parameters.forEach(param => {
      newParams[param] = '';
    });
    setParameters(newParams);
  };

  const generateRule = () => {
    let expression = ruleExpression;
    
    // Replace parameter placeholders with actual values
    Object.entries(parameters).forEach(([key, value]) => {
      expression = expression.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    
    // Replace field placeholder with actual field name
    if (fieldName) {
      expression = expression.replace(/field/g, fieldName);
    }
    
    return expression;
  };

  const loadSampleData = async () => {
    if (!tableId) return;
    
    setIsLoadingSample(true);
    try {
      // Mock sample data loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSampleData = [
        { id: 1, name: 'John Doe', email: 'john@example.com', age: 30, created_at: '2024-01-15' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25, created_at: '2024-02-20' },
        { id: 3, name: '', email: 'invalid-email', age: -5, created_at: '2025-12-31' },
        { id: 4, name: 'Bob Johnson', email: 'bob@example.com', age: 45, created_at: '2023-05-10' },
        { id: 5, name: 'Alice Brown', email: null, age: 35, created_at: '2024-03-08' }
      ];
      
      setSampleData(mockSampleData);
    } catch (error) {
      console.error('Failed to load sample data:', error);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const testRule = async () => {
    const finalRule = generateRule();
    if (!finalRule.trim()) return;
    
    setIsTestingRule(true);
    try {
      // Mock rule testing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate rule evaluation on sample data
      const results = sampleData.map(row => {
        let passes = true;
        let reason = '';
        
        // Simple validation simulation based on rule type
        if (selectedTemplate === 'non-null') {
          const fieldValue = row[fieldName || 'email'];
          passes = fieldValue !== null && fieldValue !== '';
          reason = passes ? 'Value is not null' : 'Value is null or empty';
        } else if (selectedTemplate === 'email-format') {
          const email = row[fieldName || 'email'];
          const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
          passes = email && emailRegex.test(email);
          reason = passes ? 'Valid email format' : 'Invalid email format';
        } else if (selectedTemplate === 'value-range') {
          const value = row[fieldName || 'age'];
          const min = parseInt(parameters.min_value || '0');
          const max = parseInt(parameters.max_value || '100');
          passes = value >= min && value <= max;
          reason = passes ? `Value ${value} is within range [${min}, ${max}]` : `Value ${value} is outside range [${min}, ${max}]`;
        }
        
        return {
          ...row,
          passes,
          reason
        };
      });
      
      const passCount = results.filter(r => r.passes).length;
      const failCount = results.length - passCount;
      
      setTestResults({
        results,
        summary: {
          total: results.length,
          passed: passCount,
          failed: failCount,
          passRate: ((passCount / results.length) * 100).toFixed(1)
        }
      });
    } catch (error) {
      console.error('Rule test failed:', error);
    } finally {
      setIsTestingRule(false);
    }
  };

  const handleSave = () => {
    const finalRule = generateRule();
    onSave({
      name: ruleName,
      expression: finalRule,
      template: selectedTemplate,
      tableId,
      fieldName,
      parameters
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Data Quality Rule Builder</h2>
          <p className="text-sm text-gray-600">
            Create validation rules to ensure data quality and consistency
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={!ruleName.trim() || !ruleExpression.trim()}>
            Save Rule
          </Button>
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Rule Templates</TabsTrigger>
          <TabsTrigger value="preview">Sample Data Preview</TabsTrigger>
          <TabsTrigger value="test">Test Rule</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Quick Start Section */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3">Quick Start</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Custom Rule - Featured */}
              <Card 
                className={`cursor-pointer transition-colors border-2 ${
                  selectedTemplate === 'custom' ? 'border-purple-500 bg-purple-50' : 'border-purple-200 hover:border-purple-300'
                }`}
                onClick={() => handleTemplateSelect('custom')}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center">
                      <span className="text-purple-600 mr-2">✨</span>
                      Custom Rule
                    </CardTitle>
                    <Badge variant="outline" className="border-purple-200 text-purple-700">
                      blank canvas
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Start with a blank rule and write your own SQL validation expression
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xs font-mono bg-purple-100 p-2 rounded">
                      field {'>'} 0
                    </div>
                    <div className="text-xs text-purple-600">
                      Perfect for unique business logic and complex validations
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Most Popular Template */}
              <Card 
                className={`cursor-pointer transition-colors ${
                  selectedTemplate === 'non-null' ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                }`}
                onClick={() => handleTemplateSelect('non-null')}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center">
                      <span className="text-green-600 mr-2">🔥</span>
                      Non-Null Check
                    </CardTitle>
                    <Badge variant="secondary">
                      most popular
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Quick setup for ensuring required fields are not empty
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                    customer_id IS NOT NULL
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* All Templates */}
          <div>
            <h3 className="text-md font-semibold mb-3">All Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(RULE_TEMPLATES).filter(([key]) => key !== 'custom').map(([key, template]) => (
                <Card 
                  key={key} 
                  className={`cursor-pointer transition-colors ${
                    selectedTemplate === key ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleTemplateSelect(key)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <Badge variant={template.difficulty === 'beginner' ? 'secondary' : 
                                    template.difficulty === 'intermediate' ? 'default' : 'destructive'}>
                        {template.difficulty}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                      {template.examples[0]}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Rule Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ruleName">Rule Name</Label>
                  <Input 
                    id="ruleName"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="Enter a descriptive name for this rule"
                  />
                </div>

                {RULE_TEMPLATES[selectedTemplate as keyof typeof RULE_TEMPLATES]?.parameters.map(param => (
                  <div key={param}>
                    <Label htmlFor={param}>{param.replace('_', ' ').toUpperCase()}</Label>
                    <Input 
                      id={param}
                      value={parameters[param] || ''}
                      onChange={(e) => setParameters(prev => ({ ...prev, [param]: e.target.value }))}
                      placeholder={`Enter ${param.replace('_', ' ')}`}
                    />
                  </div>
                ))}

                <div>
                  <Label htmlFor="ruleExpression">Rule Expression</Label>
                  <Textarea 
                    id="ruleExpression"
                    value={ruleExpression}
                    onChange={(e) => setRuleExpression(e.target.value)}
                    placeholder={selectedTemplate === 'custom' ? 
                      "Enter your custom SQL validation expression (e.g., field > 0, LENGTH(field) BETWEEN 5 AND 50)" : 
                      "SQL-like expression for validation"
                    }
                    rows={selectedTemplate === 'custom' ? 4 : 3}
                  />
                  {selectedTemplate === 'custom' && (
                    <div className="mt-2 space-y-3">
                      {/* Quick Insert Buttons */}
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                        <h5 className="text-sm font-medium text-purple-800 mb-2">Quick Insert:</h5>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: 'Not Null', pattern: 'field IS NOT NULL' },
                            { label: 'Email Format', pattern: 'field LIKE \'%@%\'' },
                            { label: 'Positive Number', pattern: 'field > 0' },
                            { label: 'Length Check', pattern: 'LENGTH(field) BETWEEN 1 AND 50' },
                            { label: 'In List', pattern: 'field IN (\'A\', \'B\', \'C\')' },
                            { label: 'Not Empty', pattern: 'field != \'\'' }
                          ].map(({ label, pattern }) => (
                            <Button
                              key={label}
                              variant="outline"
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={() => setRuleExpression(pattern)}
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Tips */}
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                        <h5 className="text-sm font-medium text-purple-800 mb-2">Custom Rule Tips:</h5>
                        <ul className="text-xs text-purple-700 space-y-1">
                          <li>• Use "field" as placeholder for your target field name</li>
                          <li>• Supported functions: LENGTH(), UPPER(), LOWER(), TRIM()</li>
                          <li>• Operators: =, !=, greater than, less than, BETWEEN, IN, LIKE, ~</li>
                          <li>• Examples: "field LIKE '%@%.%'", "field BETWEEN 1 AND 100"</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="text-sm font-medium mb-2">Generated Rule:</h4>
                  <code className="text-xs bg-white p-2 rounded block">
                    {generateRule() || 'Configure parameters to see generated rule'}
                  </code>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-semibold">Sample Data Preview</h3>
            <Button onClick={loadSampleData} disabled={isLoadingSample}>
              {isLoadingSample ? 'Loading...' : 'Load Sample Data'}
            </Button>
          </div>

          {isLoadingSample ? (
            <LoadingSkeleton rows={5} />
          ) : sampleData.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(sampleData[0]).map(key => (
                      <th key={key} className="text-left p-3 font-medium">
                        {key}
                        {key === fieldName && <Badge className="ml-2" variant="outline">Target Field</Badge>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleData.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      {Object.entries(row).map(([key, value]) => (
                        <td key={key} className="p-3">
                          <span className={key === fieldName ? 'font-medium' : ''}>
                            {value === null ? <span className="text-gray-400 italic">null</span> : 
                             value === '' ? <span className="text-gray-400 italic">empty</span> : 
                             String(value)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No sample data loaded. Click "Load Sample Data" to fetch random rows from the table.
            </div>
          )}
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-semibold">Test Rule Results</h3>
            <Button 
              onClick={testRule} 
              disabled={isTestingRule || !generateRule().trim() || sampleData.length === 0}
            >
              <Play className="w-4 h-4 mr-2" />
              {isTestingRule ? 'Testing...' : 'Test Rule'}
            </Button>
          </div>

          {!generateRule().trim() && (
            <div className="text-center py-4 text-gray-500">
              Configure a rule template first to enable testing
            </div>
          )}

          {sampleData.length === 0 && generateRule().trim() && (
            <div className="text-center py-4 text-gray-500">
              Load sample data first to test the rule
            </div>
          )}

          {isTestingRule && <LoadingSkeleton rows={3} />}

          {testResults && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Test Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{testResults.summary.total}</div>
                      <div className="text-xs text-gray-600">Total Records</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{testResults.summary.passed}</div>
                      <div className="text-xs text-gray-600">Passed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{testResults.summary.failed}</div>
                      <div className="text-xs text-gray-600">Failed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{testResults.summary.passRate}%</div>
                      <div className="text-xs text-gray-600">Pass Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium">Status</th>
                      {Object.keys(testResults.results[0]).filter(k => !['passes', 'reason'].includes(k)).map(key => (
                        <th key={key} className="text-left p-3 font-medium">{key}</th>
                      ))}
                      <th className="text-left p-3 font-medium">Validation Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.results.map((row: any, idx: number) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3">
                          {row.passes ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          )}
                        </td>
                        {Object.entries(row).filter(([k]) => !['passes', 'reason'].includes(k)).map(([key, value]) => (
                          <td key={key} className="p-3">
                            {value === null ? <span className="text-gray-400 italic">null</span> : 
                             value === '' ? <span className="text-gray-400 italic">empty</span> : 
                             String(value)}
                          </td>
                        ))}
                        <td className="p-3 text-xs text-gray-600">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}