import { Html, Head, Body, Container, Img, Text, Hr } from '@react-email/components';
import { CONTACT } from '@/shared/constants/contact';

export function EmailLayout({ children, preview }: { children: React.ReactNode; preview: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#F4F6F9', fontFamily: 'Inter, Arial, sans-serif' }}>
        <Container style={{ maxWidth: 600, backgroundColor: '#fff', padding: 32, borderRadius: 8 }}>
          <Img src="https://pancarteexpress.com/logo.png" width={160} alt="Pancarte Express" />
          {children}
          <Hr />
          <Text style={{ color: '#6B7280', fontSize: 12 }}>
            Pancarte Express · {CONTACT.mainPhone} · {CONTACT.infoEmail}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}