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
        bg="opsBorder"
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
          w={current <= 1 ? "0%" : `${((current - 1) / (steps.length - 1)) * 100}%`}
          transition="all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
        />
      </Box>

      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCurrent = stepNum === current;
        const isCompleted = stepNum < current;

        let nodeBorderColor = "opsBorder";
        let textColor = "opsMuted";

        if (isCurrent) {
          nodeBorderColor = "opsCyan";
          textColor = "opsCyan";
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
              bg={isCurrent ? "opsCyan" : "opsPanelMuted"}
              border="2.5px solid"
              borderColor={nodeBorderColor}
              align="center"
              justify="center"
              boxShadow="none"
              transition="all 0.3s ease"
            >
              <Text
                fontFamily="var(--font-outfit)"
                fontWeight="900"
                fontSize={{ base: "sm", md: "md" }}
                color={isCurrent ? "white" : (isCompleted ? "opsCyan" : "opsMuted")}
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
              textShadow="none"
            >
              {step}
            </Text>
          </Flex>
        );
      })}
    </HStack>
  );
}
