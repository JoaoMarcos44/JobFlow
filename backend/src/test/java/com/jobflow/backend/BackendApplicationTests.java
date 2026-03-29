package com.jobflow.backend;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@Tag("smoke")
class BackendApplicationTests {

	@Test
	@DisplayName("SMOKE: contexto Spring arranca com perfil test (H2)")
	void contextLoads() {
	}

}
