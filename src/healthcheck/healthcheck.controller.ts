import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";

@Controller()
export class HealthCheckController {
    
    @Get()
    @HttpCode(HttpStatus.OK)
    healthCheck() {
        return {
            status: "healthy"
        }
    }
}
