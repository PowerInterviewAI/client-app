import { Brain } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppState } from '@/hooks/use-app-state';
import { useConfigStore } from '@/hooks/use-config-store';
import { getElectron } from '@/lib/utils';
import { RunningState } from '@/types/app-state';
import { LLMProvider } from '@/types/llm';
import type { LLMConfigValidationResult, LLMModelInfo } from '@/types/llm';

interface LLMGroupProps {
  getDisabled: (state: RunningState, disableOnRunning?: boolean) => boolean;
}

const PROVIDERS = Object.values(LLMProvider);

const PROVIDER_LABELS: Record<LLMProvider, string> = {
  [LLMProvider.OPENAI]: 'OpenAI',
  [LLMProvider.ANTHROPIC]: 'Anthropic',
  [LLMProvider.GROQ]: 'Groq',
  [LLMProvider.GOOGLE]: 'Google',
};

export function LLMGroup({ getDisabled }: LLMGroupProps) {
  const [open, setOpen] = useState(false);
  const [useOwnApiKey, setUseOwnApiKey] = useState(false);
  const [provider, setProvider] = useState<LLMProvider>(LLMProvider.OPENAI);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [models, setModels] = useState<LLMModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [validation, setValidation] = useState<LLMConfigValidationResult | null>(null);
  const [validationMessage, setValidationMessage] = useState('Enter API key to validate');
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { runningState } = useAppState();
  const { config, updateConfig } = useConfigStore();

  const availableModels = useMemo(
    () =>
      models
        .filter((item) => item.provider === provider)
        .map((item) => item.id),
    [models, provider]
  );
  const providerValid = PROVIDERS.includes(provider);
  const modelValid = availableModels.includes(model);
  const apikeyValid = validation?.apikey_ok === true;
  const formValid = providerValid && modelValid && apikeyValid;
  const canSave = !useOwnApiKey || formValid;

  useEffect(() => {
    if (!open) return;
    const electron = getElectron();
    if (!electron?.llm) return;

    setIsLoadingModels(true);
    electron.llm
      .listModels()
      .then((response) => {
        if (!response.success) {
          toast.error(response.error ?? 'Failed to fetch LLM models');
          return;
        }
        setModels(response.data ?? []);
      })
      .catch((error) => {
        console.error('Failed to fetch llm models:', error);
        toast.error('Failed to fetch LLM models');
      })
      .finally(() => setIsLoadingModels(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const conf = config?.llmConf;
    const nextProvider = conf?.provider ?? LLMProvider.OPENAI;
    setUseOwnApiKey(conf !== null && conf !== undefined);
    setProvider(nextProvider);
    setApiKey(conf?.apikey ?? '');
    setModel(conf?.model ?? '');
    setValidation(conf ? { provider_ok: true, apikey_ok: true, model_ok: true, error: '' } : null);
    setValidationMessage(conf ? 'API key validated' : 'Enter API key to validate');
  }, [open, config?.llmConf]);

  useEffect(() => {
    // Keep persisted model while models are still loading on first open.
    if (!availableModels.length) return;
    if (!availableModels.includes(model)) {
      setModel(availableModels[0]);
    }
  }, [availableModels, model]);

  const handleProviderChange = (value: string) => {
    const nextProvider = value as LLMProvider;
    setProvider(nextProvider);
    setValidation(null);
    setValidationMessage('Provider changed. Re-validate API key.');
  };

  useEffect(() => {
    if (!open || !useOwnApiKey) return;
    const trimmed = apiKey.trim();
    if (!trimmed || !provider || !model) {
      setValidation(null);
      setValidationMessage('Provider, API key and model are required');
      return;
    }

    const electron = getElectron();
    if (!electron?.llm) return;

    const timer = setTimeout(async () => {
      setIsValidating(true);
      try {
        const result = await electron.llm.validate({
          provider,
          apikey: trimmed,
          model,
        });
        if (!result.success || !result.data) {
          setValidation(null);
          setValidationMessage(result.error ?? 'Validation failed');
          return;
        }

        setValidation(result.data);
        console.log('validation result:', result.data);
        setValidationMessage(result.data.provider_ok && result.data.apikey_ok && result.data.model_ok ? 'All details are vaild.' : result.data.error);
      } catch (error) {
        console.error('Failed to validate llm config:', error);
        setValidation(null);
        setValidationMessage('Validation request failed');
      } finally {
        setIsValidating(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [open, useOwnApiKey, provider, apiKey, model]);

  const validationOk = validation?.provider_ok && validation?.apikey_ok && validation?.model_ok;
  const validationText = isValidating ? 'Validating...' : validationMessage;
  const validationClass = validationOk
    ? 'text-green-700 dark:text-green-500 bg-green-500/10 border-green-500/20'
    : 'text-destructive bg-destructive/10 border-destructive/20';

  const saveDisabled =
    isSaving || isLoadingModels || isValidating || (useOwnApiKey && (!canSave || !validationOk));

  const providerOptions = useMemo(
    () => PROVIDERS.filter((item) => models.some((modelInfo) => modelInfo.provider === item)),
    [models]
  );

  const currentProviders = providerOptions.length > 0 ? providerOptions : PROVIDERS;

  const modelPlaceholder = isLoadingModels ? 'Loading models...' : 'Select model';

  const providerPlaceholder = isLoadingModels ? 'Loading providers...' : 'Select provider';

  const isProviderDisabled = !useOwnApiKey || isLoadingModels;
  const isModelDisabled = !useOwnApiKey || isLoadingModels;

  const currentProvider = currentProviders.includes(provider)
    ? provider
    : (currentProviders[0] ?? provider);

  useEffect(() => {
    if (currentProvider !== provider) {
      setProvider(currentProvider);
    }
  }, [currentProvider, provider]);

  useEffect(() => {
    if (!open || !useOwnApiKey) return;
    if (availableModels.length > 0 && !model) {
      setModel(availableModels[0]);
    }
  }, [open, useOwnApiKey, availableModels, model]);

  const canShowValidation = useOwnApiKey;

  const providerLabel = PROVIDER_LABELS[currentProvider] ?? currentProvider;
  void providerLabel;

  const hasModelsForProvider = availableModels.length > 0;
  const effectiveModel = hasModelsForProvider ? model : '';
  const effectiveCanSave = !useOwnApiKey || (canSave && hasModelsForProvider && !!effectiveModel);

  const onModelChange = (value: string) => {
    setModel(value);
    setValidation(null);
    setValidationMessage('Model changed. Re-validate API key.');
  };

  const handleSave = async () => {
    if (!effectiveCanSave) return;

    setIsSaving(true);
    try {
      await updateConfig({
        llmConf: useOwnApiKey
          ? {
            provider: currentProvider,
            apikey: apiKey.trim(),
            model: effectiveModel,
          }
          : null,
      });
      toast.success('LLM configuration saved');
      setOpen(false);
    } catch (error) {
      console.error('Failed to save llm configuration:', error);
      toast.error('Failed to save LLM configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 border-none rounded-xl"
            disabled={getDisabled(runningState)}
            onClick={() => setOpen(true)}
          >
            <Brain className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>LLM options</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex flex-col w-[24rem] p-4 gap-3">
          <DialogTitle>LLM Options</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            <p>Connect your own LLM provider and API key for full control.</p>
            <p>If you prefer to use our hosted models, we’ll automatically provide them based on your available credits: <strong>GPT-5.4</strong> is active while you have a balance, switching to <strong>Llama-4-Scout (17B)</strong> once credits are exhausted.</p>
          </DialogDescription>

          <div className="flex items-center justify-between rounded-md border pl-3 pr-2 py-2">
            <p className="text-sm">Use my own API key</p>
            <Button
              type="button"
              variant={useOwnApiKey ? 'default' : 'outline'}
              size="sm"
              className="w-16 h-6 text-xs"
              onClick={() => setUseOwnApiKey((prev) => !prev)}
            >
              {useOwnApiKey ? 'On' : 'Off'}
            </Button>
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-muted-foreground">LLM Provider</label>
            <Select
              value={currentProvider}
              onValueChange={handleProviderChange}
              disabled={isProviderDisabled}
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue placeholder={providerPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {currentProviders.map((item) => (
                  <SelectItem key={item} value={item}>
                    {PROVIDER_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-muted-foreground">API Key</label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key"
              className="h-8 text-xs"
              disabled={!useOwnApiKey}
            />

          </div>

          <div className="grid gap-2">
            <label className="text-xs text-muted-foreground">Model</label>
            <Select value={effectiveModel} onValueChange={onModelChange} disabled={isModelDisabled}>
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue placeholder={modelPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {canShowValidation && (
            <div
              className={`rounded-md border px-2 py-1 text-xs ${validationClass}`}
            >
              {validationText}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button size="sm" onClick={handleSave} disabled={saveDisabled}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
