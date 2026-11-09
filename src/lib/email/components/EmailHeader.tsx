import { Img, Section } from '@react-email/components';
import { LOGO_CID } from '../constants';

export function EmailHeader() {
  return (
    <Section style={header}>
      <Img
        src={`cid:${LOGO_CID}`}
        width={240}
        height={76}
        alt="Pancarte Express"
        style={logo}
      />
    </Section>
  );
}

const header = {
  backgroundColor: '#FFFFFF',
  borderBottom: '4px solid #092E5B',
  padding: '24px 0',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};
