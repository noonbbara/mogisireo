package mogi.sireo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.DefaultUriBuilderFactory;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@Service
public class PublicDataService {

    private final WebClient webClient;
    private final String baseUrl = "http://apis.data.go.kr";

    @Value("${weather.api.key}")
    private String serviceKey;

    private Mono<List<JsonNode>> filterTMXTMN(Mono<String> jsonMono) {
        ObjectMapper mapper = new ObjectMapper();

        return jsonMono.map(jsonStr -> {
            List<JsonNode> filteredList = new ArrayList<>();
            try {
                JsonNode root = mapper.readTree(jsonStr);
                JsonNode items = root.path("response")
                        .path("body")
                        .path("items")
                        .path("item");

                if (items.isArray()) {
                    for (JsonNode node : items) {
                        String category = node.path("category").asText();
                        if ("TMX".equals(category) || "TMN".equals(category)) {
                            filteredList.add(node);
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return filteredList;
        });
    }

    public PublicDataService(WebClient.Builder webClientBuilder) {
        DefaultUriBuilderFactory factory = new DefaultUriBuilderFactory(baseUrl);
        factory.setEncodingMode(DefaultUriBuilderFactory.EncodingMode.NONE);

        this.webClient = webClientBuilder
                .uriBuilderFactory(factory)
                .baseUrl(baseUrl)
                .build();
    }

    public Mono<String> getVillageForecast(String baseDate, String baseTime, int nx, int ny) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/1360000/VilageFcstInfoService_2.0/getVilageFcst")
                        .queryParam("serviceKey", serviceKey)
                        .queryParam("pageNo", 1)
                        .queryParam("numOfRows", 2000)
                        .queryParam("dataType", "JSON")
                        .queryParam("base_date", baseDate)
                        .queryParam("base_time", baseTime)
                        .queryParam("nx", nx)
                        .queryParam("ny", ny)
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .doOnNext(System.out::println);
    }

    public Mono<List<JsonNode>> getFilteredVillageForecast(String baseDate, String baseTime, int nx, int ny) {
        Mono<String> jsonMono = getVillageForecast(baseDate, baseTime, nx, ny);
        return filterTMXTMN(jsonMono);
    }
}


