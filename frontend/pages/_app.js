import '../styles/globals.css'; // Global styles
import { Amplify } from 'aws-amplify';
import awsExports from '../../src/aws-exports';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css'; // Default Amplify UI styles
import { AnimatePresence, motion } from 'framer-motion';

Amplify.configure(awsExports);

function MyApp({ Component, pageProps, router }) {
  return (
    <Authenticator.Provider>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={router.route}
          initial={{ opacity: 0, scale: 0.95, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -50 }}
          transition={{
            duration: 0.6,
            ease: "easeInOut", // Using a valid predefined easing function
          }}
        >
          <Component {...pageProps} />
        </motion.div>
      </AnimatePresence>
    </Authenticator.Provider>
  );
}

export default MyApp;