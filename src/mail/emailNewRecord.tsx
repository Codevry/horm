import { Body, Container, Head, Html, pretty, render, Section, Text } from '@react-email/components';
import * as React from 'react';

interface EmailTemplateProps {
  data: {
    jobId: string;
    jobName: string;
    record: {
      data: { [key: string]: any };
      form: string;
      id: number;
      createdAt: number;
    };
    form: {
      id: number;
      name: string;
      token: string;
      createdAt: number;
      isActive: boolean;
    };
  };
}

const Email: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  const { jobId, jobName, record, form } = data;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Job Details</Text>
          <Section style={section}>
            <table style={table}>
              <tbody>
                <tr>
                  <td style={cellHeader}>Job ID:</td>
                  <td style={cellValue}>{jobId}</td>
                </tr>
                <tr>
                  <td style={cellHeader}>Job Name:</td>
                  <td style={cellValue}>{jobName}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Text style={heading}>Record Details</Text>
          <Section style={section}>
            <table style={table}>
              <tbody>
                <tr>
                  <td style={cellHeader}>Record ID:</td>
                  <td style={cellValue}>{record.id}</td>
                </tr>
                <tr>
                  <td style={cellHeader}>Record Form Token:</td>
                  <td style={cellValue}>{record.form}</td>
                </tr>
                <tr>
                  <td style={cellHeader}>Record Created At:</td>
                  <td style={cellValue}>{new Date(record.createdAt).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={cellHeader}>Record Data:</td>
                  <td style={cellValue}>{JSON.stringify(record.data)}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Text style={heading}>Form Details</Text>
          <Section style={section}>
            <table style={table}>
              <tbody>
                <tr>
                  <td style={cellHeader}>Form ID:</td>
                  <td style={cellValue}>{form.id}</td>
                </tr>
                <tr>
                  <td style={cellHeader}>Form Name:</td>
                  <td style={cellValue}>{form.name}</td>
                </tr>
                <tr>
                  <td style={cellHeader}>Form Token:</td>
                  <td style={cellValue}>{form.token}</td>
                </tr>
                <tr>
                  <td style={cellHeader}>Form Created At:</td>
                  <td style={cellValue}>{new Date(form.createdAt).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={cellHeader}>Form Is Active:</td>
                  <td style={cellValue}>{form.isActive ? 'Yes' : 'No'}</td>
                </tr>
              </tbody>
            </table>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.0',
  textAlign: 'center' as const,
  marginBottom: '20px',
  fontWeight: 'bold',
  color: '#333',
};

const section = {
  padding: '0 40px',
  marginBottom: '20px',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const cellHeader = {
  border: '1px solid #eee',
  padding: '8px',
  backgroundColor: '#f7f7f7',
  fontWeight: 'bold',
  width: '30%',
};

const cellValue = {
  border: '1px solid #eee',
  padding: '8px',
  width: '70%',
};

export default async function (data: any): Promise<string> {
  return await pretty(await render(<Email data={data} />));
}
