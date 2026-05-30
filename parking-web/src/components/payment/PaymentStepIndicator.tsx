import { Box, Flex, HStack, Text } from "@chakra-ui/react";

const steps = ["Consultar", "Revisar", "Simular pago", "Confirmar"];

export function PaymentStepIndicator({ current }: { current: number }) {
  return (
    <HStack justify="space-between" align="center" w="full" mb="8" position="relative" px="2">
      {/* Background tracking line */}
      <Box
        position="absolute"
        top="4"
        left="6"
        right="6"
        h="2px"
        bg="rgba(30, 46, 74, 0.45)"
        zIndex="1"
      />
      
      {/* Glowing active progress line */}
      <Box
        position="absolute"
        top="4"
        left="6"
        h="2px"
        bg="opsCyan"
        boxShadow="0 0 10px #06b6d4"
        zIndex="2"
        w={current <= 1 ? "0%" : `${((current - 1) / (steps.length - 1)) * 92}%`}
        transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      />

      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCurrent = stepNum === current;
        const isCompleted = stepNum < current;
        const isUpcoming = stepNum > current;

        let nodeBorderColor = "rgba(30, 46, 74, 0.8)";
        let textColor = "opsMuted";
        let glowShadow = "none";
        
        if (isCurrent) {
          nodeBorderColor = "opsCyan";
          textColor = "opsCyan";
          glowShadow = "0 0 15px rgba(6, 182, 212, 0.5)";
        } else if (isCompleted) {
          nodeBorderColor = "opsCyan";
          textColor = "opsText";
        }

        return (
          <Flex
            key={step}
            direction="column"
            align="center"
            zIndex="3"
            position="relative"
            flex="1"
          >
            <Flex
              w="8"
              h="8"
              borderRadius="full"
              bg={isCurrent ? "opsCyan" : "rgba(13, 21, 39, 0.95)"}
              border="2px solid"
              borderColor={nodeBorderColor}
              align="center"
              justify="center"
              boxShadow={glowShadow}
              transition="all 0.3s ease"
            >
              <Text
                fontFamily="var(--font-orbitron)"
                fontWeight="900"
                fontSize="xs"
                color={isCurrent ? "black" : (isCompleted ? "opsCyan" : "opsMuted")}
              >
                {stepNum}
              </Text>
            </Flex>
            <Text
              mt="2"
              fontSize="xxs"
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="0.08em"
              color={textColor}
              textAlign="center"
              maxW="90px"
              display={{ base: "none", sm: "block" }}
              textShadow={isCurrent ? "0 0 8px rgba(6, 182, 212, 0.3)" : "none"}
            >
              {step}
            </Text>
          </Flex>
        );
      })}
    </HStack>
  );
}

