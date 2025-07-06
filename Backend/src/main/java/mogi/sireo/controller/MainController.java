package mogi.sireo.controller;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import mogi.sireo.service.PublicDataService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@CrossOrigin(origins =
        {"https://mogisireo.vercel.app",
        "http://localhost:5173"})
@RestController
@RequestMapping("/api")
public class MainController {

    private static final Logger log = LoggerFactory.getLogger(MainController.class);
    private final PublicDataService publicDataService;

    @PostMapping("/location")
    public Mono<ResponseEntity<List<JsonNode>>> receiveLocation(@RequestBody Map<String, Integer> body) {
        int nx = body.get("nx");
        int ny = body.get("ny");

        log.info("프론트에서 받은 nx: {}", nx);
        log.info("프론트에서 받은 ny: {}", ny);

        //어제 날짜를 baseDate로 설정
        LocalDate yesterday = LocalDate.now().minusDays(1);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        String baseDate = yesterday.format(formatter);

        // 하드코딩
        String baseTime = "2300";

        log.info("기상청 응답 받은거: {}", publicDataService.getVillageForecast(baseDate, baseTime, nx, ny));

        return publicDataService.getFilteredVillageForecast(baseDate, baseTime, nx, ny)
                .map(jsonString -> ResponseEntity.ok()
                        .header("Content-Type", "application/json") // JSON 타입 명시
                        .body(jsonString))
                .defaultIfEmpty(ResponseEntity.noContent().build());
    }
    
}
