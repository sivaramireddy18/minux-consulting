// Compliant C Code Solution for Day 01 Vetting Challenge
#include <stdio.h>
#include <stdint.h>

// Safe inline square function avoiding macro double evaluation hazards
static inline int32_t square_safe(int32_t x) {
    return x * x;
}

int main(void) {
    int32_t val = 6;
    int32_t result = square_safe(val);
    printf("Safe Square of %d is %d\n", val, result);
    return 0;
}
