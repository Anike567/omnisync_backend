import { Module } from "@nestjs/common";

import { TypeOrmModule } from "@nestjs/typeorm/dist/typeorm.module";
import { RefreshToken } from "./refresh-token.entity";

@Module({
    imports: [TypeOrmModule.forFeature([RefreshToken])],
    exports: [TypeOrmModule],
})
export class RefreshTokenModule {}