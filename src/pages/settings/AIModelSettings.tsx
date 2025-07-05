import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/core/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/types/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

type SecureApiKey = Pick<Database['public']['Tables']['secure_api_keys']['Row'], 'id' | 'key_name' | 'created_at'>;
type AiModel = Pick<Database['public']['Tables']['ai_models']['Row'], 'id' | 'model_name' | 'provider'>;
type ModelPreference = Database['public']['Tables']['user_ai_model_preferences']['Row'];

const AIModelSettings = () => {
  const { toast } = useToast();

  // State for keys
  const [apiKeys, setApiKeys] = useState<SecureApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isAddingKey, setIsAddingKey] = useState(false);

  // State for models
  const [availableModels, setAvailableModels] = useState<AiModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>();
  const [isUpdatingPreference, setIsUpdatingPreference] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // Fetch user's API keys (metadata only)
        const { data: keysData, error: keysError } = await supabase
          .from('secure_api_keys')
          .select('id, key_name, created_at');
        if (keysError) throw keysError;
        setApiKeys(keysData || []);

        // Fetch all available AI models (public and user-owned)
        const { data: modelsData, error: modelsError } = await supabase
          .from('ai_models')
          .select('id, model_name, provider');
        if (modelsError) throw modelsError;
        setAvailableModels(modelsData || []);
        
        // Fetch user's current model preference
        const { data: prefData, error: prefError } = await supabase
          .from('user_ai_model_preferences')
          .select('selected_model_id')
          .single();
          
        if (prefError && (prefError as PostgrestError).code !== 'PGRST116') { // Ignore "no rows found"
            throw prefError;
        }
        if (prefData) {
            setSelectedModelId(prefData.selected_model_id);
        }

      } catch (e: any) {
        setError(e.message);
        toast({ variant: 'destructive', title: 'Error fetching settings', description: e.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  // Handler to add a new API key
  const handleAddApiKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      setError("Key name and value are required.");
      return;
    }
    setIsAddingKey(true);
    setError(null);

    try {
        const { error: rpcError } = await supabase.rpc('store_encrypted_api_key', {
            key_name_to_store: newKeyName,
            key_value_to_store: newKeyValue,
        });
        if (rpcError) throw rpcError;

        toast({ title: 'Success', description: 'API Key added successfully.' });
        
        // Refetch keys to update the list
        const { data: keysData, error: keysError } = await supabase.from('secure_api_keys').select('id, key_name, created_at');
        if (keysError) throw keysError;
        setApiKeys(keysData || []);
        
        setNewKeyName('');
        setNewKeyValue('');
    } catch (e: any) {
        setError(`Failed to add key: ${e.message}`);
        toast({ variant: 'destructive', title: 'Error adding key', description: e.message });
    } finally {
        setIsAddingKey(false);
    }
  };

  // Handler to delete an API key
  const handleDeleteKey = async (keyId: string) => {
    if (!window.confirm("Are you sure you want to delete this key? This cannot be undone.")) return;

    try {
        const { error } = await supabase.from('secure_api_keys').delete().eq('id', keyId);
        if (error) throw error;
        setApiKeys(apiKeys.filter(key => key.id !== keyId));
        toast({ title: 'Success', description: 'API Key deleted.' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error deleting key', description: e.message });
    }
  }

  // Handler to update model preference
  const handleUpdatePreference = async (modelId: string) => {
    setIsUpdatingPreference(true);
    setError(null);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { error: upsertError } = await supabase
            .from('user_ai_model_preferences')
            .upsert({ user_id: user.id, selected_model_id: modelId, updated_at: new Date().toISOString() });
        
        if (upsertError) throw upsertError;
        
        setSelectedModelId(modelId);
        toast({ title: 'Success', description: 'Model preference updated.' });
    } catch (e: any) {
        setError(`Failed to update preference: ${e.message}`);
        toast({ variant: 'destructive', title: 'Error updating preference', description: e.message });
    } finally {
        setIsUpdatingPreference(false);
    }
  };
  
  if (loading) return <div>Loading AI settings...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Model Preference</CardTitle>
          <CardDescription>
            Select the default AI model for your Executive Assistant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-destructive mb-4">{error}</p>}
          <div className="flex items-center space-x-4">
            <Select value={selectedModelId} onValueChange={handleUpdatePreference} disabled={isUpdatingPreference}>
                <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                    {availableModels.map(model => (
                        <SelectItem key={model.id} value={model.id}>
                            {`${model.provider} / ${model.model_name}`}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {isUpdatingPreference && <p>Updating...</p>}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Bring Your Own Key (BYOK)</CardTitle>
          <CardDescription>
            Add your own API keys to be billed directly by the provider. Your keys are encrypted and stored securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleAddApiKey} className="space-y-4 max-w-md">
                <Input 
                    placeholder="Key Name (e.g., Personal OpenAI Key)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    disabled={isAddingKey}
                />
                <Input 
                    type="password"
                    placeholder="sk-..."
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    disabled={isAddingKey}
                />
                <Button type="submit" disabled={isAddingKey}>
                    {isAddingKey ? "Adding..." : "Add API Key"}
                </Button>
            </form>
            <div className="mt-6">
                <h3 className="text-lg font-medium">Your API Keys</h3>
                <ul className="mt-2 space-y-2 max-w-md">
                    {apiKeys.length > 0 ? apiKeys.map(key => (
                        <li key={key.id} className="flex justify-between items-center p-3 border rounded-lg bg-secondary/50">
                            <div>
                                <span className="font-mono text-sm">{key.key_name}</span>
                                <p className="text-xs text-muted-foreground">Created: {new Date(key.created_at).toLocaleDateString()}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteKey(key.id)}>Delete</Button>
                        </li>
                    )) : (
                        <p className="text-sm text-muted-foreground mt-4">You have not added any API keys.</p>
                    )}
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIModelSettings; 