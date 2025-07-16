'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TestTube, 
  Zap, 
  Brain, 
  Heart, 
  Target, 
  Building, 
  GraduationCap,
  User
} from 'lucide-react';

interface TestScenario {
  id: string;
  title: string;
  description: string;
  category: 'life_commitment' | 'professional_commitment' | 'personal_growth' | 'relationship_commitment' | 'skill_commitment';
  intensity: 'low' | 'medium' | 'high' | 'life_changing';
  sampleText: string;
  expectedExtractions: string[];
  expectedCommitments: string[];
  philosophicalContext: string;
}

const testScenarios: TestScenario[] = [
  {
    id: 'career_transition',
    title: 'Career Transition',
    description: 'Professional commitment to changing careers',
    category: 'professional_commitment',
    intensity: 'high',
    sampleText: "I've decided to transition from finance to software engineering. I will dedicate the next 2 years to mastering programming languages like Python and JavaScript. I'm committed to becoming a full-stack developer and will never give up on this goal. I want to work at a tech startup where I can make a real impact.",
    expectedExtractions: ['Python', 'JavaScript', 'full-stack developer', 'tech startup'],
    expectedCommitments: ['transition to software engineering', 'mastering programming languages', 'becoming a full-stack developer'],
    philosophicalContext: 'This represents a fundamental career pivot that requires sustained commitment and identity transformation.'
  },
  {
    id: 'skill_mastery',
    title: 'Skill Mastery Commitment',
    description: 'Deep commitment to developing specific skills',
    category: 'skill_commitment',
    intensity: 'high',
    sampleText: "I will practice data science every single day for the next year. I'm committed to mastering machine learning algorithms and deep learning frameworks like TensorFlow. I will become an expert in statistical analysis and data visualization. This is my path to becoming a data scientist.",
    expectedExtractions: ['data science', 'machine learning', 'TensorFlow', 'statistical analysis', 'data visualization'],
    expectedCommitments: ['practice data science daily', 'mastering machine learning', 'becoming an expert in statistical analysis'],
    philosophicalContext: 'This shows dedication to deliberate practice and the pursuit of expertise through consistent effort.'
  },
  {
    id: 'personal_growth',
    title: 'Personal Development',
    description: 'Commitment to self-improvement and growth',
    category: 'personal_growth',
    intensity: 'life_changing',
    sampleText: "I need to work on my emotional intelligence and communication skills. I will develop my ability to connect with people and become a better listener. I'm committed to overcoming my social anxiety and will practice public speaking. This is about becoming the person I want to be.",
    expectedExtractions: ['emotional intelligence', 'communication skills', 'public speaking'],
    expectedCommitments: ['work on emotional intelligence', 'develop ability to connect with people', 'overcoming social anxiety'],
    philosophicalContext: 'This represents deep personal transformation and the courage to address fundamental aspects of self.'
  },
  {
    id: 'life_purpose',
    title: 'Life Purpose Declaration',
    description: 'Fundamental life direction and purpose',
    category: 'life_commitment',
    intensity: 'life_changing',
    sampleText: "My life's purpose is to help others achieve their potential through education and mentorship. I will always be dedicated to teaching and inspiring the next generation. I've decided to become a lifelong learner and share my knowledge with others. This is my calling.",
    expectedExtractions: ['education', 'mentorship', 'teaching'],
    expectedCommitments: ['help others achieve their potential', 'dedicated to teaching', 'become a lifelong learner'],
    philosophicalContext: 'This is a declaration of life mission that transcends personal gain and focuses on service to others.'
  },
  {
    id: 'relationship_commitment',
    title: 'Relationship Investment',
    description: 'Commitment to building and maintaining relationships',
    category: 'relationship_commitment',
    intensity: 'high',
    sampleText: "I will prioritize my relationships with family and friends. I want to be present for the people I care about and will make time for meaningful conversations. I'm committed to being a better friend and will support others in their journey. Building strong connections is important to me.",
    expectedExtractions: ['family', 'friends', 'meaningful conversations'],
    expectedCommitments: ['prioritize relationships', 'be present for people', 'being a better friend'],
    philosophicalContext: 'This reflects understanding that relationships require intentional investment and presence.'
  },
  {
    id: 'mixed_commitments',
    title: 'Multiple Commitments',
    description: 'Complex scenario with multiple types of commitments',
    category: 'professional_commitment',
    intensity: 'high',
    sampleText: "I'm committed to advancing my career in product management while also working on my leadership skills. I will learn agile methodologies and user experience design. I want to mentor junior team members and create a positive work environment. I'm also dedicated to maintaining work-life balance and spending quality time with my family.",
    expectedExtractions: ['product management', 'leadership skills', 'agile methodologies', 'user experience design'],
    expectedCommitments: ['advancing career in product management', 'working on leadership skills', 'mentor junior team members', 'maintaining work-life balance'],
    philosophicalContext: 'This shows the complexity of modern professional life where multiple commitments must be balanced.'
  },
  {
    id: 'entrepreneurial_vision',
    title: 'Entrepreneurial Vision',
    description: 'Commitment to building something new',
    category: 'professional_commitment',
    intensity: 'life_changing',
    sampleText: "I will build a sustainable technology company that addresses climate change. I'm committed to creating innovative solutions for renewable energy and will dedicate my life to this mission. I want to assemble a team of passionate engineers and scientists. This is about making a real difference in the world.",
    expectedExtractions: ['technology company', 'climate change', 'renewable energy', 'engineers', 'scientists'],
    expectedCommitments: ['build a sustainable technology company', 'creating innovative solutions', 'dedicate life to this mission'],
    philosophicalContext: 'This represents entrepreneurial vision combined with social mission - using business as a force for positive change.'
  }
];

interface TestScenariosProps {
  onRunScenario: (scenario: TestScenario) => void;
}

export default function TestScenarios({ onRunScenario }: TestScenariosProps) {
  const getCategoryIcon = (category: TestScenario['category']) => {
    switch (category) {
      case 'life_commitment': return <Heart className="h-4 w-4" />;
      case 'professional_commitment': return <Building className="h-4 w-4" />;
      case 'personal_growth': return <User className="h-4 w-4" />;
      case 'relationship_commitment': return <Heart className="h-4 w-4" />;
      case 'skill_commitment': return <Brain className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getIntensityColor = (intensity: TestScenario['intensity']) => {
    switch (intensity) {
      case 'life_changing': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryLabel = (category: TestScenario['category']) => {
    const labels = {
      life_commitment: 'Life Direction',
      professional_commitment: 'Career',
      personal_growth: 'Personal Growth',
      relationship_commitment: 'Relationships',
      skill_commitment: 'Skills'
    };
    return labels[category];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test Scenarios
        </CardTitle>
        <p className="text-sm text-gray-600">
          Test the conversation agent with realistic commitment scenarios
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {testScenarios.map((scenario) => (
              <Card key={scenario.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(scenario.category)}
                      <h3 className="font-semibold text-sm">{scenario.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(scenario.category)}
                      </Badge>
                      <Badge className={`${getIntensityColor(scenario.intensity)} text-white text-xs`}>
                        {scenario.intensity}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{scenario.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Sample Text:</h4>
                      <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded">
                        &quot;{scenario.sampleText}&quot;
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Expected Extractions:</h4>
                      <div className="flex flex-wrap gap-1">
                        {scenario.expectedExtractions.map((extraction, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {extraction}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Expected Commitments:</h4>
                      <div className="flex flex-wrap gap-1">
                        {scenario.expectedCommitments.map((commitment, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {commitment}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Philosophical Context:</h4>
                      <p className="text-xs text-gray-600">{scenario.philosophicalContext}</p>
                    </div>
                    
                    <Button 
                      onClick={() => onRunScenario(scenario)}
                      size="sm"
                      className="w-full"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Run Scenario
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}