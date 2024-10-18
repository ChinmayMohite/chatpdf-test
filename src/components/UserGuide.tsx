import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type Props = {};

const UserGuide = (props: Props) => {
  const content = [
    {
      value: 'item-1',
      question: 'What does this app do and how to use it?',
      answer: (
        <span>
          The app harnesses the power of AI to assist users in interacting with
          and understanding PDF documents. To utilize the app, follow these
          simple steps:
          <ol className="list-decimal list-inside font-semibold">
            <li>
              Upload your PDF file to the platform and give the system a moment
              to process it.
            </li>
            <li>
              Once processed, you can engage in a chat-like interface where you
              can ask specific questions about the content of your document.
            </li>
            <li>
              The AI will analyze your query and provide responses based on the
              information contained within your PDF.
            </li>
          </ol>
          This interactive approach allows for a more intuitive understanding of
          complex documents, saving time and enhancing productivity.
        </span>
      ),
    },
    {
      value: 'item-2',
      question: 'What you need to know before using...',
      answer: (
        <span>
          Please note:
          <ul className="list-disc list-inside">
            <li>The app is for demo purposes and not commercial use.</li>
            <li>
              Subscriptions are feature placeholders and do not process real
              payments.
            </li>
            <li>
              Avoid uploading sensitive data; user privacy cannot be fully
              guaranteed.
            </li>
            <li>
              AI responses are based on your document&apos;s content; accuracy
              is not guaranteed.
            </li>
            <li className="font-semibold">
              Users are responsible for the use and interpretation of the
              AI&apos;s information.
            </li>
          </ul>
          Exercise caution and use at your own discretion.
        </span>
      ),
    },
    {
      value: 'item-3',
      question: 'Code and Contact Me',
      answer: (
        <span>
          View the source code on{' '}
          <a
            href="https://github.com/ChinmayMohite"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold"
          >
            GitHub
          </a>
          <br />
          or contact me via{' '}
          <a
            href="mailto:Scott-Zeta@outlook.com"
            className="underline font-semibold"
          >
            mohite.chinmay.231102@gmail.com
          </a>
          .
        </span>
      ),
    },
  ];
  return (
    <Accordion type="single" collapsible className="w-full">
      {content.map(({ value, question, answer }) => {
        return (
          <AccordionItem value={value} key={value}>
            <AccordionTrigger>{question}</AccordionTrigger>
            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default UserGuide;