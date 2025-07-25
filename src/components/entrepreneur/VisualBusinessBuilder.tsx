import React, { useState, useCallback } from 'react';
import { Users, DollarSign, Megaphone, Cog, TrendingUp, CheckCircle, ArrowRight, Lightbulb, Heart, Star, Puzzle, Rocket } from 'lucide-react';
interface BusinessComponent {
  id: string;
  type: 'idea' | 'customers' | 'value' | 'marketing' | 'revenue' | 'operations' | 'growth';
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  isCompleted: boolean;
  content?: string;
  subComponents?: string[];
}

interface BusinessCanvas {
  id: string;
  name: string;
  components: BusinessComponent[];
  completionPercentage: number;
}

export const VisualBusinessBuilder: React.FC = () => {
  const [canvas, setCanvas] = useState<BusinessCanvas>(createEmptyCanvas());
  const [activeComponent, setActiveComponent] = useState<BusinessComponent | null>(null);
  const [showGuidance, setShowGuidance] = useState(true);

  const handleComponentClick = (component: BusinessComponent) => {
    setActiveComponent(component);
  };

  const handleComponentUpdate = (componentId: string, content: string) => {
    setCanvas(prev => ({
      ...prev,
      components: prev.components.map(comp => 
        comp.id === componentId 
          ? { ...comp, content, isCompleted: content.length > 10 }
          : comp
      )
    }));
    
    // Update completion percentage
    updateCompletionPercentage();
  };

  const updateCompletionPercentage = useCallback(() => {
    setCanvas(prev => {
      const completedCount = prev.components.filter(comp => comp.isCompleted).length;
      const percentage = Math.round((completedCount / prev.components.length) * 100);
      return { ...prev, completionPercentage: percentage };
    });
  }, []);

  const closeModal = () => {
    setActiveComponent(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center space-x-4">
            <Puzzle className="w-10 h-10 text-primary" />
            <span>Visual Business Builder</span>
            <Puzzle className="w-10 h-10 text-secondary" />
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Build your business step by step. Click on each piece to fill it out. 
            <strong className="text-primary"> No business jargon, just simple questions!</strong>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Your Business Progress</h2>
            <span className="text-2xl font-bold text-primary">{canvas.completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${canvas.completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Complete all sections to get your personalized business plan!
          </p>
        </div>

        {/* Guidance Panel */}
        {showGuidance && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8 border-l-4 border-success">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <Lightbulb className="w-6 h-6 text-success mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">How This Works</h3>
                  <div className="space-y-1 text-sm text-foreground/90">
                    <p>• Click on any colored box below to fill it out</p>
                    <p>• Answer simple questions in plain English</p>
                    <p>• Watch your business plan come together piece by piece</p>
                    <p>• Get personalized guidance based on your answers</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowGuidance(false)}
                className="text-muted-foreground hover: text-muted-foreground"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Business Canvas */}
        <div className="bg-card rounded-2xl shadow-xl p-8">
          <div className="grid grid-cols-1 md: grid-cols-3 lg:grid-cols-4 gap-6">
            {canvas.components.map((component) => (
              <BusinessComponentCard
                key={component.id}
                component={component}
                onClick={() => handleComponentClick(component)}
              />
            ))}
          </div>
        </div>

        {/* Completion Celebration */}
        {canvas.completionPercentage === 100 && (
          <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl p-8 mt-8 text-primary-foreground text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Star className="w-8 h-8" />
              <h2 className="text-3xl font-bold">Congratulations!</h2>
              <Star className="w-8 h-8" />
            </div>
            <p className="text-xl mb-6">
              You've completed your business plan! You're ready to start building your dream business.
            </p>
            <button className="bg-card text-primary px-8 py-3 rounded-lg font-semibold hover: bg-muted transition-colors">
              <div className="flex items-center space-x-2">
                <Rocket className="w-5 h-5" />
                <span>Launch Your Business</span>
              </div>
            </button>
          </div>
        )}

        {/* Component Detail Modal */}
        {activeComponent && (
          <ComponentDetailModal
            component={activeComponent}
            onUpdate={(content) => handleComponentUpdate(activeComponent.id, content)}
            onClose={closeModal}
          />
        )}
      </div>
    </div>
  );
};

const BusinessComponentCard: React.FC<{
  component: BusinessComponent;
  onClick: () => void;
}> = ({ component, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover: scale-105 hover:shadow-lg
        ${component.isCompleted 
          ? `border-${component.color}-500 bg-${component.color}-50` 
          : 'border-border bg-background hover:border-gray-400'
        }
      `}
    >
      {/* Completion Badge */}
      {component.isCompleted && (
        <div className="absolute -top-2 -right-2">
          <CheckCircle className={`w-6 h-6 text-${component.color}-600 bg-card rounded-full`} />
        </div>
      )}

      {/* Icon */}
      <div className={`
        w-12 h-12 rounded-lg flex items-center justify-center mb-4
        ${component.isCompleted ? `bg-${component.color}-100` : 'bg-gray-200'}
      `}>
        <component.icon className={`
          w-6 h-6 
          ${component.isCompleted ? `text-${component.color}-600` : 'text-muted-foreground'}
        `} />
      </div>

      {/* Content */}
      <h3 className="font-semibold text-foreground mb-2">{component.title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{component.description}</p>

      {/* Status */}
      <div className="flex items-center justify-between">
        <span className={`
          text-xs font-medium px-2 py-1 rounded-full
          ${component.isCompleted 
            ? `text-${component.color}-700 bg-${component.color}-100` 
            : 'text-muted-foreground bg-gray-200'
          }
        `}>
          {component.isCompleted ? 'Completed' : 'Click to start'}
        </span>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
};

const ComponentDetailModal: React.FC<{
  component: BusinessComponent;
  onUpdate: (content: string) => void;
  onClose: () => void;
}> = ({ component, onUpdate, onClose }) => {
  const [content, setContent] = useState(component.content || '');

  const handleSave = () => {
    onUpdate(content);
    onClose();
  };

  const getComponentQuestions = (type: string): Array<{question: string; placeholder: string; helper: string}> => {
    const questions: Record<string, Array<{question: string; placeholder: string; helper: string}>> = {
      idea: [
        {
          question: "What's your business idea?",
          placeholder: "e.g., I want to sell handmade jewelry online",
          helper: "Keep it simple - what do you want to offer?"
        },
        {
          question: "What problem does this solve?",
          placeholder: "e.g., People want unique, affordable jewelry",
          helper: "What need or want does your idea address?"
        }
      ],
      customers: [
        {
          question: "Who are your ideal customers?",
          placeholder: "e.g., Women aged 25-40 who love unique accessories",
          helper: "Be specific - age, interests, lifestyle"
        },
        {
          question: "Where do these customers hang out?",
          placeholder: "e.g., Instagram, local craft fairs, boutique shops",
          helper: "Online and offline places you can reach them"
        }
      ],
      value: [
        {
          question: "What makes your offering special?",
          placeholder: "e.g., Handmade with recycled materials, custom designs",
          helper: "What sets you apart from competitors?"
        },
        {
          question: "What's the main benefit for customers?",
          placeholder: "e.g., Express their unique style affordably",
          helper: "What's the biggest value you provide?"
        }
      ],
      marketing: [
        {
          question: "How will you tell people about your business?",
          placeholder: "e.g., Social media posts, word of mouth, local events",
          helper: "Start with free or low-cost methods"
        },
        {
          question: "What's your key message?",
          placeholder: "e.g., Beautiful, unique jewelry that tells your story",
          helper: "What do you want people to remember about you?"
        }
      ],
      revenue: [
        {
          question: "How will you make money?",
          placeholder: "e.g., Sell jewelry for $25-150 per piece",
          helper: "What will you charge and how often?"
        },
        {
          question: "What are your main costs?",
          placeholder: "e.g., Materials $10/piece, website $30/month",
          helper: "List your biggest expenses"
        }
      ],
      operations: [
        {
          question: "How will you deliver your product/service?",
          placeholder: "e.g., Make jewelry at home, ship via mail",
          helper: "The practical steps to serve customers"
        },
        {
          question: "What tools or resources do you need?",
          placeholder: "e.g., Jewelry tools, packaging, website",
          helper: "What do you need to get started?"
        }
      ],
      growth: [
        {
          question: "How will you grow your business?",
          placeholder: "e.g., Add new jewelry styles, expand to wholesale",
          helper: "Ideas for making it bigger over time"
        },
        {
          question: "What's your big vision?",
          placeholder: "e.g., Become the go-to brand for eco-friendly jewelry",
          helper: "Where do you want this to go eventually?"
        }
      ]
    };

    return questions[type] || [];
  };

  const questions = getComponentQuestions(component.type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-gradient-to-r from-${component.color}-500 to-${component.color}-600 p-6 text-primary-foreground`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <component.icon className="w-8 h-8" />
              <h2 className="text-2xl font-bold">{component.title}</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-primary-foreground hover: text-gray-200 text-2xl"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 opacity-90">{component.description}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {questions.map((q, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-foreground/90 mb-2">
                {q.question}
              </label>
              <textarea
                className="w-full px-4 py-3 border border-border rounded-lg focus: ring-2 focus:ring-blue-500 focus:border-primary"
                rows={3}
                placeholder={q.placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">{q.helper}</p>
            </div>
          ))}

          {/* Simple Examples */}
          <div className={`bg-${component.color}-50 rounded-lg p-4`}>
            <h4 className="font-medium text-foreground mb-2 flex items-center">
              <Lightbulb className="w-4 h-4 mr-2" />
              Quick Examples
            </h4>
            <div className="text-sm text-muted-foreground space-y-1">
              {getExamplesForComponent(component.type).map((example, index) => (
                <p key={index}>• {example}</p>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={handleSave}
              className={`
                flex-1 bg-gradient-to-r from-${component.color}-600 to-${component.color}-700 
                text-primary-foreground px-6 py-3 rounded-lg font-semibold hover: from-${component.color}-700 
                hover:to-${component.color}-800 transition-all duration-200
              `}
            >
              Save & Continue
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-border text-foreground/90 rounded-lg font-semibold hover:bg-background transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getExamplesForComponent = (type: string): string[] => {
  const examples: Record<string, string[]> = {
    idea: [
      "Tutoring service for high school students",
      "Custom birthday cakes for kids",
      "Dog walking service for busy professionals",
      "Online course teaching guitar basics"
    ],
    customers: [
      "Busy parents who want help with their kids' education",
      "Pet owners who work long hours",
      "People who want to learn music but can't afford expensive lessons",
      "Small business owners who need marketing help"
    ],
    value: [
      "More convenient than driving to a tutor",
      "Personalized attention your pet deserves",
      "Learn at your own pace from home",
      "Affordable alternative to hiring an agency"
    ],
    marketing: [
      "Post before/after photos on Instagram",
      "Ask happy customers to tell their friends",
      "Leave flyers at local coffee shops",
      "Join Facebook groups where your customers hang out"
    ],
    revenue: [
      "Charge $30/hour for tutoring sessions",
      "Monthly subscription of $50 for dog walking",
      "One-time course fee of $99",
      "Package deals: 3 sessions for $200"
    ],
    operations: [
      "Meet students at their homes or library",
      "Use scheduling app to manage appointments",
      "Create video lessons and upload to platform",
      "Deliver cakes personally or via pickup"
    ],
    growth: [
      "Add more subjects like math and science",
      "Hire other tutors to serve more students",
      "Create advanced courses for repeat customers",
      "Expand to neighboring cities"
    ]
  };

  return examples[type] || [];
};

function createEmptyCanvas(): BusinessCanvas {
  return {
    id: 'business-canvas-1',
    name: 'My Business Plan',
    completionPercentage: 0,
    components: [
      {
        id: 'idea',
        type: 'idea',
        title: 'Your Big Idea',
        description: 'What do you want to build?',
        icon: Lightbulb,
        color: 'yellow',
        isCompleted: false
      },
      {
        id: 'customers',
        type: 'customers',
        title: 'Your Customers',
        description: 'Who will love this?',
        icon: Users,
        color: 'blue',
        isCompleted: false
      },
      {
        id: 'value',
        type: 'value',
        title: 'Your Special Sauce',
        description: 'What makes you different?',
        icon: Heart,
        color: 'red',
        isCompleted: false
      },
      {
        id: 'marketing',
        type: 'marketing',
        title: 'Spreading the Word',
        description: 'How will people find you?',
        icon: Megaphone,
        color: 'green',
        isCompleted: false
      },
      {
        id: 'revenue',
        type: 'revenue',
        title: 'Making Money',
        description: 'How will you get paid?',
        icon: DollarSign,
        color: 'emerald',
        isCompleted: false
      },
      {
        id: 'operations',
        type: 'operations',
        title: 'Getting It Done',
        description: 'How will you deliver?',
        icon: Cog,
        color: 'purple',
        isCompleted: false
      },
      {
        id: 'growth',
        type: 'growth',
        title: 'Growing Bigger',
        description: 'How will you scale up?',
        icon: TrendingUp,
        color: 'orange',
        isCompleted: false
      }
    ]
  };
} 