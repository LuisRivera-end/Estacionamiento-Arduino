import { Box, Flex, HStack, Text } from "@chakra-ui/react";

const steps = ["Consultar", "Revisar", "Pagar", "Confirmar"];

export function PaymentStepIndicator({ current }: { current: number }) {
  return (
    <HStack justify="space-between" align="center" w="full" mb="0" position="relative" px="4">
      {/* Background tracking line */}
      <Box
        position="absolute"
        top={{ base: "18px", md: "24px" }}
        left="10"
        right="10"
        h="3px"
        bg="rgba(30, 46, 74, 0.45)"
        zIndex="1"
      />
      
      {/* Glowing active progress line */}
      <Box
        position="absolute"
        top={{ base: "18px", md: "24px" }}
        left="10"
        right="10"
        zIndex="2"
        pointerEvents="none"
      >
        <Box
          h="3px"
          bg="opsCyan"
          boxShadow="0 0 14px #06b6d4, 0 0 6px #06b6d4"
          w={current <= 1 ? "0%" : `${((current - 1) / (steps.length - 1)) * 100}%`}
          transition="all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
        />
      </Box>

      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCurrent = stepNum === current;
        const isCompleted = stepNum < current;

        let nodeBorderColor = "rgba(30, 46, 74, 0.8)";
        let textColor = "opsMuted";
        let glowShadow = "none";
        
        if (isCurrent) {
          nodeBorderColor = "opsCyan";
          textColor = "opsCyan";
          glowShadow = "0 0 20px rgba(6, 182, 212, 0.55)";
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
              w={{ base: "9", md: "12" }}
              h={{ base: "9", md: "12" }}
              borderRadius="full"
              bg={isCurrent ? "opsCyan" : "rgba(13, 21, 39, 0.95)"}
              border="2.5px solid"
              borderColor={nodeBorderColor}
              align="center"
              justify="center"
              boxShadow={glowShadow}
              transition="all 0.3s ease"
            >
              <Text
                fontFamily="var(--font-orbitron)"
                fontWeight="900"
                fontSize={{ base: "sm", md: "md" }}
                color={isCurrent ? "black" : (isCompleted ? "opsCyan" : "opsMuted")}
              >
                {stepNum}
              </Text>
            </Flex>
            <Text
              mt="3"
              fontSize={{ base: "xxs", md: "sm" }}
              fontWeight="900"
              textTransform="uppercase"
              letterSpacing="0.1em"
              color={textColor}
              textAlign="center"
              whiteSpace="nowrap"
              display={{ base: "none", sm: "block" }}
              textShadow={isCurrent ? "0 0 10px rgba(6, 182, 212, 0.35)" : "none"}
            >
              {step}
            </Text>
          </Flex>
        );
      })}
    </HStack>
  );
}
