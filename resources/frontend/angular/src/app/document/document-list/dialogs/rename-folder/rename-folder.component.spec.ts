import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenameFolderComponent } from './rename-folder.component';

describe('RenameFolderComponent', () => {
  let component: RenameFolderComponent;
  let fixture: ComponentFixture<RenameFolderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RenameFolderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RenameFolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
