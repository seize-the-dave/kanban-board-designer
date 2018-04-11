package uk.co.sustainablepace.kanbanboarddesigner;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BoardController {

    @RequestMapping("/board")
    public Board create() {
        return new Board();
    }
}
