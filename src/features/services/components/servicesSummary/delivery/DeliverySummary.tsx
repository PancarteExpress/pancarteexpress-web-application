import { useTranslations } from 'next-intl';
import type { DeliveryDetails } from '@/features/services/types/delivery';
import styles from '../servicesSummary.module.css';
import {
  Field, Fields, Pill, SubSection, TextOrEmpty, UnitCard, UnitGrid, UnitRow, UnitRows,
} from '../SummaryParts';

export function DeliverySummary({ details }: { details: DeliveryDetails }) {
  const { frames, addons, keybox, directionals, others } = details;
  const t = useTranslations('services');
  const tDelivery = useTranslations('services.delivery');

  const yesNo = (value: boolean) =>
    value ? <Pill tone="success">{t('common.yes')}</Pill> : t('common.no');

  /** Modèle fixe, ou « Modèle particulier : description » */
  const modelLabel = (label: string, description?: string) =>
    description ? t('summary.labelWithDescription', { label, description }) : label;

  return (
    <div className={styles.installation}>
      {frames && (
        <SubSection title={t('summary.deliveryFrames', { count: frames.length })}>
          <UnitGrid>
            {frames.map((f, i) => (
              <UnitCard key={i} title={t('summary.modelNumber', { number: i + 1 })}>
                <UnitRows>
                  <UnitRow label={t('summary.model')}>
                    {modelLabel(t(`frameModels.${f.model}`), f.model === 'custom' ? f.description : undefined)}
                  </UnitRow>
                  <UnitRow label={t('summary.quantity')}>{f.quantity}</UnitRow>
                  <UnitRow label={t('summary.withAnchorsAndPoles')}>{yesNo(f.withAnchorsAndPoles)}</UnitRow>
                </UnitRows>
              </UnitCard>
            ))}
          </UnitGrid>
        </SubSection>
      )}

      {addons && (
        <SubSection title={t('summary.deliveryAddons', { count: addons.length })}>
          <UnitGrid>
            {addons.map((a, i) => {
              const label = tDelivery(`addons.${a.addon}`);
              const title =
                a.addon === 'other' ? t('summary.labelWithDetail', { label, detail: a.mention })
                : a.addon === 'customNoMention' && a.model ? t('summary.labelWithModel', { label, model: a.model })
                : label;
              return (
                <UnitCard key={i} title={title}>
                  <UnitRows>
                    <UnitRow label={t('summary.quantity')}>{a.quantity}</UnitRow>
                  </UnitRows>
                </UnitCard>
              );
            })}
          </UnitGrid>
        </SubSection>
      )}

      {keybox && (
        <SubSection title={t('summary.deliveryKeyboxes')}>
          <Fields>
            <Field label={t('summary.quantity')}>{keybox.quantity}</Field>
            <Field label={t('summary.combination')}>
              <TextOrEmpty value={keybox.code} emptyLabel={t('common.notSpecified')} />
            </Field>
          </Fields>
        </SubSection>
      )}

      {directionals && (
        <SubSection title={t('summary.deliveryDirectionals', { count: directionals.length })}>
          <UnitGrid>
            {directionals.map((d, i) => (
              <UnitCard key={i} title={t('summary.modelNumber', { number: i + 1 })}>
                <UnitRows>
                  <UnitRow label={t('summary.model')}>
                    {modelLabel(
                      tDelivery(`directionalModels.${d.model}`),
                      d.model === 'custom' ? d.description : undefined,
                    )}
                  </UnitRow>
                  <UnitRow label={t('summary.quantity')}>{d.quantity}</UnitRow>
                  <UnitRow label={t('summary.withPoles')}>{yesNo(d.withPoles)}</UnitRow>
                </UnitRows>
              </UnitCard>
            ))}
          </UnitGrid>
        </SubSection>
      )}

      {others && (
        <SubSection title={t('summary.deliveryOthers', { count: others.length })}>
          <UnitGrid>
            {others.map((o, i) => (
              <UnitCard key={i} title={o.description}>
                <UnitRows>
                  <UnitRow label={t('summary.quantity')}>{o.quantity}</UnitRow>
                </UnitRows>
              </UnitCard>
            ))}
          </UnitGrid>
        </SubSection>
      )}
    </div>
  );
}