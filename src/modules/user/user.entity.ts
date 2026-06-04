import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') // Automatically generates a UUID
  id!: string;

  @Column({ unique: true }) // Added unique for production safety
  email!: string;

  @Column()
  passwordHash!: string;

  @Column()
  username!: string;

  @Column()
  phoneNumber!: string;
}