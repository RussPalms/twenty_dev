import { useGetManyServerlessFunctions } from '@/settings/serverless-functions/hooks/useGetManyServerlessFunctions';
import { Select, SelectOption } from '@/ui/input/components/Select';
import { WorkflowEditGenericFormBase } from '@/workflow/components/WorkflowEditGenericFormBase';
import VariableTagInput from '@/workflow/search-variables/components/VariableTagInput';
import { FunctionInput } from '@/workflow/types/FunctionInput';
import { WorkflowCodeStep } from '@/workflow/types/Workflow';
import { getDefaultFunctionInputFromInputSchema } from '@/workflow/utils/getDefaultFunctionInputFromInputSchema';
import { mergeDefaultFunctionInputAndFunctionInput } from '@/workflow/utils/mergeDefaultFunctionInputAndFunctionInput';
import { setNestedValue } from '@/workflow/utils/setNestedValue';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { ReactNode, useEffect, useState } from 'react';
import { HorizontalSeparator, IconCode, isDefined } from 'twenty-ui';
import { useDebouncedCallback } from 'use-debounce';
import { ServerlessFunction } from '~/generated/graphql';

const StyledContainer = styled.div`
  display: inline-flex;
  flex-direction: column;
`;

const StyledLabel = styled.div`
  color: ${({ theme }) => theme.font.color.light};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  margin-top: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StyledInputContainer = styled.div`
  background: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
  position: relative;
`;

type WorkflowEditActionFormServerlessFunctionInnerProps =
  | {
      action: WorkflowCodeStep;
      selectedServerlessFunction: ServerlessFunction;
      readonly: true;
    }
  | {
      action: WorkflowCodeStep;
      selectedServerlessFunction: ServerlessFunction;
      readonly?: false;
      onActionUpdate: (action: WorkflowCodeStep) => void;
    };

type ServerlessFunctionInputFormData = {
  [field: string]: string | ServerlessFunctionInputFormData;
};

export const WorkflowEditActionFormServerlessFunctionInner = (
  props: WorkflowEditActionFormServerlessFunctionInnerProps,
) => {
  const theme = useTheme();

  const { serverlessFunctions } = useGetManyServerlessFunctions();

  const getFunctionInput = (serverlessFunctionId: string) => {
    if (!serverlessFunctionId) {
      return {};
    }

    const serverlessFunction = serverlessFunctions.find(
      (f) => f.id === serverlessFunctionId,
    );
    const inputSchema = serverlessFunction?.latestVersionInputSchema;
    const defaultFunctionInput =
      getDefaultFunctionInputFromInputSchema(inputSchema);

    return defaultFunctionInput;
  };

  const [selectedFunctionId, setSelectedFunctionId] = useState(
    props.action.settings.input.serverlessFunctionId,
  );

  const [functionInput, setFunctionInput] =
    useState<ServerlessFunctionInputFormData>(
      mergeDefaultFunctionInputAndFunctionInput({
        defaultFunctionInput: getFunctionInput(selectedFunctionId),
        functionInput: props.action.settings.input.serverlessFunctionInput,
      }),
    );

  useEffect(() => {
    // TODO
    setSelectedFunctionId(props.action.settings.input.serverlessFunctionId);
  }, [props.action.settings.input.serverlessFunctionId]);

  const updateFunctionInput = useDebouncedCallback(
    async (newFunctionInput: object) => {
      if (props.readonly === true) {
        return;
      }

      props.onActionUpdate({
        ...props.action,
        settings: {
          ...props.action.settings,
          input: {
            ...props.action.settings.input,
            serverlessFunctionInput: newFunctionInput,
          },
        },
      });
    },
    1_000,
  );

  const handleInputChange = (value: any, path: string[]) => {
    const updatedFunctionInput = setNestedValue(functionInput, path, value);

    setFunctionInput(updatedFunctionInput);

    updateFunctionInput(updatedFunctionInput);
  };

  const availableFunctions: Array<SelectOption<string>> = [
    ...serverlessFunctions
      .filter((serverlessFunction) =>
        isDefined(serverlessFunction.latestVersion),
      )
      .map((serverlessFunction) => ({
        label: serverlessFunction.name,
        value: serverlessFunction.id,
        latestVersionInputSchema: serverlessFunction.latestVersionInputSchema,
      })),
  ];

  const handleFunctionChange = (newServerlessFunctionId: string) => {
    if (props.readonly === true) {
      return;
    }

    updateFunctionInput.cancel();

    setSelectedFunctionId(newServerlessFunctionId);

    const serverlessFunction = serverlessFunctions.find(
      (f) => f.id === newServerlessFunctionId,
    );

    const newFunctionInput = getFunctionInput(newServerlessFunctionId);

    const newProps = {
      ...props.action,
      settings: {
        ...props.action.settings,
        input: {
          serverlessFunctionId: newServerlessFunctionId,
          serverlessFunctionVersion:
            serverlessFunction?.latestVersion || 'latest',
          serverlessFunctionInput: newFunctionInput,
        },
      },
    };

    setFunctionInput(newFunctionInput);

    props.onActionUpdate(newProps);
  };

  const renderFields = (
    functionInput: FunctionInput,
    path: string[] = [],
    isRoot = true,
  ): ReactNode[] => {
    const displaySeparator = (functionInput: FunctionInput) => {
      const keys = Object.keys(functionInput);
      if (keys.length > 1) {
        return true;
      }
      if (keys.length === 1) {
        const subKeys = Object.keys(functionInput[keys[0]]);
        return subKeys.length > 0;
      }
      return false;
    };

    return Object.entries(functionInput).map(([inputKey, inputValue]) => {
      const currentPath = [...path, inputKey];
      const pathKey = currentPath.join('.');

      if (inputValue !== null && typeof inputValue === 'object') {
        if (isRoot) {
          return (
            <>
              {displaySeparator(functionInput) && (
                <HorizontalSeparator noMargin />
              )}
              {renderFields(inputValue, currentPath, false)}
            </>
          );
        }
        return (
          <StyledContainer key={pathKey}>
            <StyledLabel>{inputKey}</StyledLabel>
            <StyledInputContainer>
              {renderFields(inputValue, currentPath, false)}
            </StyledInputContainer>
          </StyledContainer>
        );
      } else {
        return (
          <VariableTagInput
            key={pathKey}
            inputId={`input-${inputKey}`}
            label={inputKey}
            placeholder="Enter value (use {{variable}} for dynamic content)"
            value={`${inputValue || ''}`}
            onChange={(value) => handleInputChange(value, currentPath)}
          />
        );
      }
    });
  };

  return (
    <WorkflowEditGenericFormBase
      HeaderIcon={<IconCode color={theme.color.orange} />}
      headerTitle="Code - Serverless Function"
      headerType="Code"
    >
      <Select
        dropdownId="select-serverless-function-id"
        label="Function"
        fullWidth
        value={selectedFunctionId}
        options={availableFunctions}
        emptyOption={{ label: 'None', value: '' }}
        disabled={props.readonly}
        onChange={handleFunctionChange}
      />
      {renderFields(functionInput)}
    </WorkflowEditGenericFormBase>
  );
};
