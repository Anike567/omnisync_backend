import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity('refresh_tokens') // Use snake_case for table names
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    @Index() // Crucial: Add an index for faster lookups during the refresh flow
    userId!: string;

    @Column({ nullable: false })
    hashedToken!: string; // Store the HASH, not the raw token


    @CreateDateColumn()
    createdAt!: Date;

    @Column({ type: 'timestamp' })
    expiresAt!: Date; // Explicitly track when the token should die
}