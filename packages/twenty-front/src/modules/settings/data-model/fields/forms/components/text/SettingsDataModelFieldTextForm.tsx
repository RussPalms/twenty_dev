import { Controller, useFormContext } from 'react-hook-form';

import { FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { Select } from '@/ui/input/components/Select';
import styled from '@emotion/styled';
import { CardContent } from 'twenty-ui';
import { z } from 'zod';

const StyledFormCardTitle = styled.div`
  color: ${({ theme }) => theme.font.color.light};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

type SettingsDataModelFieldTextFormProps = {
  disabled?: boolean;
  fieldMetadataItem: Pick<
    FieldMetadataItem,
    'icon' | 'label' | 'type' | 'defaultValue' | 'settings'
  >;
};

export const textFieldDefaultValueSchema = z.object({
  displayMaxRows: z.number().nullable(),
});

export const settingsDataModelFieldtextFormSchema = z.object({
  settings: textFieldDefaultValueSchema,
});

export type SettingsDataModelFieldTextFormValues = z.infer<
  typeof settingsDataModelFieldtextFormSchema
>;

export const SettingsDataModelFieldTextForm = ({
  disabled,
  fieldMetadataItem,
}: SettingsDataModelFieldTextFormProps) => {
  const { control } = useFormContext<SettingsDataModelFieldTextFormValues>();
  return (
    <CardContent>
      <Controller
        name="settings"
        defaultValue={{
          displayMaxRows: fieldMetadataItem?.settings?.displayMaxRows || 0,
        }}
        control={control}
        render={({ field: { onChange, value } }) => {
          const displayMaxRows = value?.displayMaxRows ?? 0;

          return (
            <>
              <StyledFormCardTitle>Wrap on record pages</StyledFormCardTitle>
              <Select
                disabled={disabled}
                dropdownId="selectTextWrap"
                options={[
                  {
                    label: 'Deactivated',
                    value: 0,
                  },
                  {
                    label: '2',
                    value: 2,
                  },
                  {
                    label: '5',
                    value: 5,
                  },
                  {
                    label: '10',
                    value: 10,
                  },
                  {
                    label: 'all',
                    value: 99,
                  },
                ]}
                value={displayMaxRows}
                onChange={(value) => onChange({ displayMaxRows: value })}
                withSearchInput={false}
                dropdownWidthAuto={true}
              />
            </>
          );
        }}
      />
    </CardContent>
  );
};
