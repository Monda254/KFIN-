import type {
  DnaProfileState,
  StrAllele,
  ProfileStatus,
  ProfileQuality,
  DnaIndexCode,
} from "../types";
import { DnaProfileStateMachine } from "./state-machine";
import {
  DnaConcurrencyConflictError,
  DnaLegalHoldViolationError,
} from "../types";

export class DnaProfileAggregate {
  private state: DnaProfileState;

  constructor(initialState: DnaProfileState) {
    this.state = {
      ...initialState,
      version: initialState.version || 1,
      alleles: initialState.alleles ? [...initialState.alleles] : [],
    };
  }

  public getState(): Readonly<DnaProfileState> {
    return Object.freeze({ ...this.state });
  }

  public getId(): string {
    return this.state.id;
  }

  public getProfileIdentifier(): string {
    return this.state.profileIdentifier;
  }

  public getStatus(): ProfileStatus {
    return this.state.profileStatus;
  }

  public getIndexCode(): DnaIndexCode {
    return this.state.indexCode;
  }

  public getAlleles(): ReadonlyArray<StrAllele> {
    return this.state.alleles;
  }

  public isLegalHold(): boolean {
    return this.state.isLegalHold;
  }

  public getVersion(): number {
    return this.state.version;
  }

  public checkConcurrency(expectedVersion?: number): void {
    if (expectedVersion !== undefined && expectedVersion !== this.state.version) {
      throw new DnaConcurrencyConflictError(
        `Optimistic concurrency conflict on DNA profile '${this.state.profileIdentifier}': expected version ${expectedVersion}, active version ${this.state.version}`
      );
    }
  }

  public addOrUpdateAllele(allele: StrAllele): void {
    const idx = this.state.alleles.findIndex(
      (a) => a.locusName.toUpperCase() === allele.locusName.toUpperCase()
    );
    if (idx >= 0) {
      this.state.alleles[idx] = { ...allele };
    } else {
      this.state.alleles.push({ ...allele });
    }
    this.state.lociCount = this.state.alleles.length;
    this.state.updatedAt = new Date().toISOString();
  }

  public setQuality(quality: ProfileQuality): void {
    this.state.profileQuality = quality;
    this.state.updatedAt = new Date().toISOString();
  }

  public approve(approverId: string, expectedVersion?: number): void {
    this.checkConcurrency(expectedVersion);
    DnaProfileStateMachine.assertTransition(this.state.profileStatus, "ACTIVE");

    this.state.profileStatus = "ACTIVE";
    this.state.approvedById = approverId;
    this.state.version++;
    this.state.updatedAt = new Date().toISOString();
  }

  public suspend(expectedVersion?: number): void {
    this.checkConcurrency(expectedVersion);
    DnaProfileStateMachine.assertTransition(this.state.profileStatus, "SUSPENDED");

    this.state.profileStatus = "SUSPENDED";
    this.state.version++;
    this.state.updatedAt = new Date().toISOString();
  }

  public withdraw(reason: string, expectedVersion?: number): void {
    this.checkConcurrency(expectedVersion);
    if (this.state.isLegalHold) {
      throw new DnaLegalHoldViolationError(
        `Cannot withdraw DNA profile '${this.state.profileIdentifier}' while under active Legal Hold`
      );
    }

    DnaProfileStateMachine.assertTransition(this.state.profileStatus, "WITHDRAWN");
    this.state.profileStatus = "WITHDRAWN";
    this.state.notes = reason ? `Withdrawn: ${reason}` : this.state.notes;
    this.state.version++;
    this.state.updatedAt = new Date().toISOString();
  }

  public setLegalHold(hold: boolean, expectedVersion?: number): void {
    this.checkConcurrency(expectedVersion);
    this.state.isLegalHold = hold;
    this.state.version++;
    this.state.updatedAt = new Date().toISOString();
  }
}
