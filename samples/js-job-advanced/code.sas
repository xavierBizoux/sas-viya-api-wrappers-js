%macro param_list(mvar=, outvar=, dlm=, quote=n);

    %local I PARAMLIST;

    %if (%bquote(&MVAR) eq ) %then %do;
        %put ERROR: You must specify a value for the MVAR argument.;

        data _null_;
            abort cancel nolist;
        run;
        %goto exit;
    %end;

    %if (%symexist(&MVAR) ne 1) %then %do;
        %put ERROR: Macro variable "&MVAR" does not exist.;

        data _null_;
            abort cancel nolist;
        run;
        %goto exit;
    %end;

    %if (%bquote(%upcase(&QUOTE)) ne Y) and (%bquote(%upcase(&QUOTE)) ne N)
        %then %do;
        %put ERROR: You must specify either Y or N for the QUOTE argument.;

        data _null_;
            abort cancel nolist;
        run;
        %goto exit;
    %end;

    %let QUOTE=%upcase(&QUOTE);

    %if (%bquote(&OUTVAR) eq ) %then %let OUTVAR=_&MVAR;

    %if (%sysfunc(nvalid(%bquote(&OUTVAR), v7)) ne 1) %then %do;
        %put ERROR: Please specify a valid macro variable name for the OUTVAR
            argument.;

        data _null_;
            abort cancel nolist;
        run;
        %goto exit;
    %end;

    %global &OUTVAR;

    %global &MVAR.0;

    %if (%bquote(&&&MVAR.0) eq ) %then %do;
        %if (&QUOTE eq Y) %then %let
            PARAMLIST=%sysfunc(quote(%bquote(&&&MVAR)));
        %else %let PARAMLIST=%bquote(&&&MVAR);
    %end;
    %else %do I=1 %to &&&MVAR.0;
        %if (&I eq 1) %then %do;
            %if (&QUOTE eq Y) %then %let
                PARAMLIST=%sysfunc(quote(%bquote(&&&MVAR&I)));
            %else %let PARAMLIST=%bquote(&&&MVAR&I);
        %end;
        %else %do;
            %if (&QUOTE eq Y) %then %let PARAMLIST=&PARAMLIST.&DLM
                %sysfunc(quote(%bquote(&&&MVAR&I)));
            %else %let PARAMLIST=&PARAMLIST.&DLM %bquote(&&&MVAR&I);
        %end;
    %end;

    %let &OUTVAR=&PARAMLIST;

    %exit: %mend param_list;

%param_list(mvar=types, outvar=inTypes, dlm=%str(,), quote=y)
    %param_list(mvar=drivetrains, outvar=inDrivetrains, dlm=%str(,), quote=y)
    ods graphics / reset width=6.4in height=4.8in imagemap;

proc sgplot data=SASHELP.CARS;
    hbar Make / response=Invoice group=Type groupdisplay=stack;
    xaxis grid;
    where type in (&inTypes) and drivetrain in (&inDrivetrains) and horsepower <
        &horsepowerMax and MSRP < &priceMax;
run;

ods graphics / reset;
